import { v2 } from './vector';
import { XorShift32 } from './rng';
import { Player, Ball } from './player';
import { PITCH_W, PITCH_H, DECISION_INTERVAL, ROLES, STATES, Z_PICKUP, GOAL_W } from './constants';
const statProfiles = {
    GK: { pace: 45, passing: 30, shooting: 10, stamina: 50, positioning: 70, reflexes: 85 },
    DEF: { pace: 65, passing: 45, shooting: 25, stamina: 70, positioning: 80, reflexes: 40 },
    MID: { pace: 75, passing: 70, shooting: 55, stamina: 80, positioning: 65, reflexes: 30 },
    ATT: { pace: 85, passing: 60, shooting: 80, stamina: 65, positioning: 60, reflexes: 20 },
    WIN: { pace: 90, passing: 65, shooting: 75, stamina: 75, positioning: 55, reflexes: 25 },
};
function buildTeam(teamId, rng) {
    const formation = [
        { role: ROLES.GK, x: 0.05, y: 0.5 },
        { role: ROLES.DEF, x: 0.15, y: 0.2 },
        { role: ROLES.DEF, x: 0.15, y: 0.8 },
        { role: ROLES.DEF, x: 0.25, y: 0.4 },
        { role: ROLES.DEF, x: 0.25, y: 0.6 },
        { role: ROLES.MID, x: 0.4, y: 0.25 },
        { role: ROLES.MID, x: 0.4, y: 0.5 },
        { role: ROLES.MID, x: 0.4, y: 0.75 },
        { role: ROLES.ATT, x: 0.65, y: 0.3 },
        { role: ROLES.ATT, x: 0.65, y: 0.7 },
        { role: ROLES.WIN, x: 0.8, y: 0.5 },
    ];
    return formation.map((p, i) => {
        const rx = teamId === 'B' ? 1 - p.x : p.x;
        const hp = { x: rx * PITCH_W, y: p.y * PITCH_H };
        const stats = { ...statProfiles[p.role] };
        for (const k in stats)
            stats[k] = v2.clamp(stats[k] + rng.range(-8, 8), 10, 99);
        const pl = new Player(`${teamId}_${p.role}_${i}`, teamId, p.role, hp, stats, rng);
        return pl;
    });
}
export class FootballEngine {
    config;
    rng;
    seq = 0;
    clockSec = 0;
    startedAtMs = Date.now();
    events = [];
    ball;
    teamA;
    teamB;
    allPlayers;
    score = { A: 0, B: 0 };
    running = false;
    goalCooldown = 0;
    resetCooldown = 0;
    constructor(config) {
        this.config = config;
        this.rng = new XorShift32(config.seed);
        this.ball = new Ball();
        this.teamA = buildTeam('A', this.rng);
        this.teamB = buildTeam('B', this.rng);
        this.allPlayers = [...this.teamA, ...this.teamB];
    }
    start() {
        this.running = true;
    }
    pause() {
        this.running = false;
    }
    tick(dtSec) {
        if (!this.running)
            return;
        if (this.goalCooldown > 0) {
            this.goalCooldown -= dtSec;
            return;
        }
        if (this.resetCooldown > 0) {
            this.resetCooldown -= dtSec;
            this.allPlayers.forEach(p => {
                p.targetPos = { ...p.homePos };
                p.hasBall = false;
            });
            if (this.resetCooldown <= 0) {
                this._kickoff();
            }
            return;
        }
        this.clockSec += dtSec;
        this.allPlayers.forEach(p => {
            if (p.decisionTimer <= 0) {
                p.decisionTimer = DECISION_INTERVAL + this.rng.range(-0.05, 0.05);
                this._decide(p);
            }
        });
        this._applySeparation();
        this.allPlayers.forEach(p => p.update(dtSec, this.ball, this.allPlayers.filter(t => t.team === p.team && t !== p), this.allPlayers.filter(t => t.team !== p.team)));
        this.ball.update(dtSec);
        if (!this.ball.owner) {
            this._checkPickup();
        }
        this._checkGoal();
        this._checkBallOut();
        this.seq += 1;
    }
    getSnapshot() {
        return {
            matchId: this.config.matchId,
            seq: this.seq,
            serverTimeMs: Date.now() - this.startedAtMs,
            clockSec: this.clockSec,
            score: { ...this.score },
            ball: {
                x: this.ball.pos.x,
                y: this.ball.pos.y,
                z: this.ball.z,
                vx: this.ball.vel.x,
                vy: this.ball.vel.y,
                vz: this.ball.vz,
            },
            players: this.allPlayers.map(p => ({
                id: p.id,
                team: p.team,
                role: p.role,
                x: p.pos.x,
                y: p.pos.y,
                vx: p.vel.x,
                vy: p.vel.y,
                state: p.state,
                hasBall: p.hasBall,
            })),
            events: [...this.events],
        };
    }
    _decide(player) {
        const teammates = this.allPlayers.filter(t => t.team === player.team && t !== player);
        const opponents = this.allPlayers.filter(t => t.team !== player.team);
        const goalPos = { x: player.team === 'A' ? PITCH_W : 0, y: PITCH_H / 2 };
        if (!player.hasBall) {
            this._decideWithoutBall(player, teammates, opponents, goalPos);
        }
        else {
            this._decideWithBall(player, teammates, opponents, goalPos);
        }
    }
    _decideWithoutBall(player, teammates, opponents, goalPos) {
        const ball = this.ball;
        const distToBall = v2.dist(player.pos, ball.pos);
        const canReach = distToBall < 120;
        if (canReach && !ball.owner) {
            player.targetPos = { ...ball.pos };
            player.state = STATES.MOVING;
            return;
        }
        if (ball.owner && ball.owner.team === player.team) {
            const supportOffset = this.rng.range(-30, 30);
            player.targetPos = {
                x: v2.clamp(ball.pos.x + supportOffset, 20, PITCH_W - 20),
                y: v2.clamp(ball.pos.y + supportOffset, 20, PITCH_H - 20),
            };
            player.state = STATES.MOVING;
            return;
        }
        const home = { ...player.homePos };
        const shift = player.team === 'A' ? 0.05 : -0.05;
        const minX = player.team === 'A' ? PITCH_W * 0.2 : 0;
        const maxX = player.team === 'A' ? PITCH_W - 50 : PITCH_W * 0.45;
        const runOffset = this.rng.range(-30, 30);
        home.x = v2.clamp(home.x + shift * PITCH_W, minX, maxX);
        home.y = v2.clamp(home.y + runOffset, 60, PITCH_H - 60);
        const wander = { x: this.rng.range(-8, 8), y: this.rng.range(-8, 8) };
        const newTarget = { x: home.x + wander.x, y: home.y + wander.y };
        const distToNewTarget = v2.dist(player.targetPos, newTarget);
        if (distToNewTarget > 25 || player.state === STATES.IDLE) {
            player.targetPos = newTarget;
            player.state = STATES.MOVING;
        }
    }
    _decideWithBall(player, teammates, opponents, goalPos) {
        const toGoal = v2.sub(goalPos, player.pos);
        const distToGoal = v2.len(toGoal);
        const canShoot = distToGoal < 250;
        const passTarget = teammates.find(t => v2.dist(t.pos, player.pos) > 80 && v2.dist(t.pos, goalPos) < distToGoal);
        let valueSHOOT = 0;
        let valuePASS = 0;
        let valueDRIBBLE = 0;
        if (canShoot) {
            const pressure = this._calcPressure(player, opponents);
            valueSHOOT = (1 - pressure) * (player.stats.shooting / 100) * 0.7;
        }
        if (passTarget) {
            const passSuccess = (player.stats.passing / 100) * 0.8;
            valuePASS = passSuccess * 0.6;
        }
        const myPosVal = player.team === 'A' ? player.pos.x / PITCH_W : 1 - player.pos.x / PITCH_W;
        const posGain = 0.02;
        const dribbleFeasible = opponents.filter(o => v2.dist(o.pos, player.pos) < 60).length < 2;
        const posGainVal = dribbleFeasible ? posGain : -0.01;
        valueDRIBBLE = myPosVal * 0.4 + posGainVal * 0.6;
        const vShoot = valueSHOOT + this.rng.range(0, 0.08);
        const vPass = valuePASS + this.rng.range(0, 0.08);
        const vDribble = valueDRIBBLE + this.rng.range(0, 0.06);
        if (vShoot >= vPass && vShoot >= vDribble && valueSHOOT > 0.05) {
            this._shoot(player, goalPos);
        }
        else if (vPass >= vDribble && passTarget) {
            this._pass(player, passTarget);
        }
        else {
            const dir = v2.norm(v2.sub(goalPos, player.pos));
            player.targetPos = v2.add(player.pos, v2.scale(dir, 55 + this.rng.range(0, 35)));
            player.state = STATES.MOVING;
        }
    }
    _shoot(player, goalPos) {
        const goalCY = PITCH_H / 2;
        const playerOffsetY = player.pos.y - goalCY;
        const aimY = playerOffsetY > 0 ? goalCY + this.rng.range(8, 28) : goalCY - this.rng.range(8, 28);
        const target = { x: goalPos.x, y: aimY };
        const dist = v2.dist(player.pos, target);
        const opponents = this.allPlayers.filter(p => p.team !== player.team);
        const pressure = this._calcPressure(player, opponents);
        const maxError = 0.04 + pressure * 0.14 + (dist / 600) * 0.06;
        const errorAngle = this.rng.range(-maxError, maxError);
        const baseDir = v2.norm(v2.sub(target, player.pos));
        const cos = Math.cos(errorAngle);
        const sin = Math.sin(errorAngle);
        const shootDir = { x: baseDir.x * cos - baseDir.y * sin, y: baseDir.x * sin + baseDir.y * cos };
        const speed = 340 + this.rng.range(0, 60);
        this.ball.launchGround(player.pos, v2.add(player.pos, v2.scale(shootDir, 1000)), speed);
        this.ball.lastKicker = player;
        player.hasBall = false;
        this.ball.owner = null;
        player.state = STATES.SHOOTING;
        this.events.push({ type: 'SHOT', data: { playerId: player.id, target }, timestamp: this.clockSec });
    }
    _pass(player, receiver) {
        const ball = this.ball;
        const isThrough = v2.dist(player.pos, receiver.pos) > 200;
        const flightTime = v2.dist(player.pos, receiver.pos) / 300;
        const receiverSpeed = receiver.maxSpeed * 0.7;
        let landingPos;
        if (isThrough) {
            const runDir = v2.norm(v2.sub(receiver.targetPos, receiver.pos));
            landingPos = {
                x: v2.clamp(receiver.pos.x + runDir.x * receiverSpeed * flightTime + this.rng.range(-12, 12), 20, PITCH_W - 20),
                y: v2.clamp(receiver.pos.y + runDir.y * receiverSpeed * flightTime + this.rng.range(-10, 10), 20, PITCH_H - 20),
            };
        }
        else {
            landingPos = {
                x: receiver.pos.x + this.rng.range(-14, 14),
                y: receiver.pos.y + this.rng.range(-14, 14),
            };
        }
        const opponents = this.allPlayers.filter(p => p.team !== player.team);
        const interceptor = this._findInterceptor(player.pos, landingPos, opponents);
        const interceptRisk = interceptor ? 0.4 : 0.05;
        if (!isThrough) {
            if (interceptor && this.rng.nextFloat01() < interceptRisk * 0.65) {
                interceptor.state = STATES.RECEIVING;
                interceptor.receivingTarget = { ...landingPos };
                interceptor.targetPos = { ...landingPos };
            }
        }
        const speed = 280 + this.rng.range(0, 40);
        ball.launchGround(player.pos, landingPos, speed);
        ball.lastKicker = player;
        player.hasBall = false;
        ball.owner = null;
        player.state = STATES.MOVING;
        receiver.state = STATES.RECEIVING;
        receiver.receivingTarget = { ...landingPos };
        receiver.targetPos = { ...landingPos };
        this.events.push({ type: 'PASS', data: { from: player.id, to: receiver.id }, timestamp: this.clockSec });
    }
    _findInterceptor(from, to, opponents) {
        let best = null;
        let bestDist = Infinity;
        opponents.forEach(o => {
            const d = this._distToSegment(o.pos, from, to);
            if (d < bestDist && d < 25) {
                best = o;
                bestDist = d;
            }
        });
        return best;
    }
    _distToSegment(p, a, b) {
        const ab = v2.sub(b, a);
        const ap = v2.sub(p, a);
        const t = v2.clamp(v2.dot(ap, ab) / v2.dot(ab, ab), 0, 1);
        const proj = v2.add(a, v2.scale(ab, t));
        return v2.dist(p, proj);
    }
    _calcPressure(player, opponents) {
        const close = opponents.filter(o => v2.dist(o.pos, player.pos) < 80);
        return Math.min(1, close.length * 0.3);
    }
    _applySeparation() {
        const sepRadius = 20;
        this.allPlayers.forEach(p => {
            const nearby = this.allPlayers.filter(o => o !== p && v2.dist(o.pos, p.pos) < sepRadius);
            if (nearby.length === 0)
                return;
            const push = v2.scale(nearby.reduce((acc, o) => v2.add(acc, v2.sub(p.pos, o.pos)), { x: 0, y: 0 }), 0.5);
            p.targetPos = v2.add(p.targetPos, push);
        });
    }
    _checkPickup() {
        if (this.ball.z > Z_PICKUP || this.ball.isAerial)
            return;
        const nearby = this.allPlayers.filter(p => v2.dist(p.pos, this.ball.pos) < 20);
        if (nearby.length === 0)
            return;
        const picker = nearby[0];
        picker.hasBall = true;
        picker.state = STATES.WITH_BALL;
        this.ball.owner = picker;
        this.ball.inFlight = false;
    }
    _checkGoal() {
        if (this.ball.z > 0 || this.ball.isAerial)
            return;
        const inGoalY = this.ball.pos.y > PITCH_H / 2 - GOAL_W / 2 && this.ball.pos.y < PITCH_H / 2 + GOAL_W / 2;
        if (!inGoalY)
            return;
        const scoredA = this.ball.pos.x < 20;
        const scoredB = this.ball.pos.x > PITCH_W - 20;
        if (scoredA) {
            this.score.B += 1;
            this.events.push({ type: 'GOAL', data: { team: 'B', scorer: this.ball.lastKicker?.id }, timestamp: this.clockSec });
        }
        else if (scoredB) {
            this.score.A += 1;
            this.events.push({ type: 'GOAL', data: { team: 'A', scorer: this.ball.lastKicker?.id }, timestamp: this.clockSec });
        }
        else {
            return;
        }
        this.goalCooldown = 2;
        this.resetCooldown = 3;
    }
    _checkBallOut() {
        const out = this.ball.pos.x < 0 || this.ball.pos.x > PITCH_W || this.ball.pos.y < 0 || this.ball.pos.y > PITCH_H;
        if (!out)
            return;
        if (this.goalCooldown > 0 || this.resetCooldown > 0)
            return;
        this.events.push({ type: 'BALL_OUT', data: { pos: { ...this.ball.pos } }, timestamp: this.clockSec });
        const side = this.ball.pos.x < 0 ? 'B' : this.ball.pos.x > PITCH_W ? 'A' : this.ball.pos.y < 0 ? 'A' : 'B';
        const throwInTeam = side;
        const throwInPlayer = this.allPlayers.find(p => p.team === throwInTeam && v2.dist(p.pos, this.ball.pos) < 150);
        if (throwInPlayer) {
            throwInPlayer.targetPos = { ...this.ball.pos };
            throwInPlayer.state = STATES.MOVING;
        }
        this.ball.pos = { x: v2.clamp(this.ball.pos.x, 20, PITCH_W - 20), y: v2.clamp(this.ball.pos.y, 20, PITCH_H - 20) };
        this.ball.vel = { x: 0, y: 0 };
        this.ball.z = 0;
        this.ball.vz = 0;
        this.ball.inFlight = false;
        this.ball.isAerial = false;
    }
    _kickoff() {
        this.ball.pos = { x: PITCH_W / 2, y: PITCH_H / 2 };
        this.ball.vel = { x: 0, y: 0 };
        this.ball.z = 0;
        this.ball.vz = 0;
        this.ball.isAerial = false;
        this.ball.owner = null;
        this.ball.inFlight = false;
        const mid = this.allPlayers.find(p => p.role === ROLES.MID && p.team === 'A') || this.allPlayers[0];
        mid.pos = { x: PITCH_W / 2 + 10, y: PITCH_H / 2 };
        mid.hasBall = true;
        mid.state = STATES.WITH_BALL;
        this.ball.owner = mid;
    }
}
//# sourceMappingURL=engine.js.map