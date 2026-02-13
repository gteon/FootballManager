import { v2 } from './vector';
import { XorShift32 } from './rng';
import { Player, Ball } from './player';
import { PITCH_W, PITCH_H, DECISION_INTERVAL, ROLES, STATES, Z_PICKUP, GOAL_W, SEPARATION_RADIUS, PLAYER_RADIUS, MAX_PASS_DIST, AWARENESS_R } from './constants';
const HALF_DURATION_SEC = 3 * 60;
const FULL_DURATION_SEC = HALF_DURATION_SEC * 2;
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
    half = 1;
    finished = false;
    startedAtMs = Date.now();
    events = [];
    ball;
    teamA;
    teamB;
    allPlayers;
    score = { A: 0, B: 0 };
    running = true;
    constructor(config) {
        this.config = config;
        this.rng = new XorShift32(config.seed);
        this.ball = new Ball();
        this.teamA = buildTeam('A', this.rng);
        this.teamB = buildTeam('B', this.rng);
        this.allPlayers = [...this.teamA, ...this.teamB];
        this._kickoff();
    }
    start() {
        this.running = true;
    }
    pause() {
        this.running = false;
    }
    tick(dtSec) {
        if (!this.running || this.finished)
            return;
        const prevClock = this.clockSec;
        this.clockSec += dtSec;
        if (prevClock < HALF_DURATION_SEC && this.clockSec >= HALF_DURATION_SEC) {
            this.half = 2;
            this.events.push({ type: 'HALF_TIME', timestamp: this.clockSec });
        }
        if (this.clockSec >= FULL_DURATION_SEC) {
            this.finished = true;
            this.running = false;
            this.events.push({ type: 'FULL_TIME', timestamp: this.clockSec });
            return;
        }
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
        const inOwnHalf = this._inOwnHalf(player);
        const pressure = this._calcPressure(player, opponents);
        if ((player.role === ROLES.DEF || player.role === ROLES.GK) && inOwnHalf) {
            let closestOppDist = Infinity;
            for (const op of opponents) {
                const d = v2.dist(op.pos, player.pos);
                if (d < closestOppDist)
                    closestOppDist = d;
            }
            const underThreat = pressure > 0.45 || closestOppDist < 65;
            if (underThreat && player.clearanceCooldown <= 0) {
                this._doClearance(player, teammates);
                return;
            }
        }
        const toGoal = v2.sub(goalPos, player.pos);
        const distToGoal = v2.len(toGoal);
        const myPosVal = this._positionValue(player.pos, goalPos, opponents);
        let valueSHOOT = 0;
        {
            const maxShootDist = player.role === ROLES.ATT
                ? 280
                : player.role === ROLES.MID
                    ? 220
                    : player.role === ROLES.WIN
                        ? 200
                        : 160;
            if (distToGoal < maxShootDist) {
                const angleRad = Math.atan2(GOAL_W, Math.max(distToGoal, 1));
                const angleQ = v2.clamp(angleRad / (Math.PI / 3), 0, 1);
                const clearLine = this._isLineClearRadius(player.pos, goalPos, opponents, 28);
                const shotQuality = angleQ * (player.stats.shooting / 100) * (clearLine ? 1.0 : 0.4);
                const ctxShoot = (distToGoal < 150 ? 1.5 : 1.0) + (pressure > 0.5 ? 0.25 : 0);
                valueSHOOT = shotQuality * ctxShoot;
            }
        }
        let bestPass = null;
        let valuePASS = -1;
        for (const tm of teammates) {
            if (tm.role === ROLES.GK && !inOwnHalf)
                continue;
            const d = v2.dist(player.pos, tm.pos);
            if (d > MAX_PASS_DIST)
                continue;
            if (d < 55)
                continue;
            const interceptRisk = this._interceptRisk(player.pos, tm.pos, opponents);
            const passSuccessProb = (player.stats.passing / 100) *
                (1 - interceptRisk * 0.7) *
                v2.clamp(1 - d / MAX_PASS_DIST, 0.1, 1);
            const receiverPosVal = this._positionValue(tm.pos, goalPos, opponents);
            let valueThisPass = receiverPosVal * passSuccessProb;
            const openness = this._receiverOpenness(tm, opponents);
            valueThisPass += openness * 0.08;
            const progVal = this._progressValue(player.pos, tm.pos);
            if (progVal > 0.4)
                valueThisPass += 0.06;
            if (valueThisPass > valuePASS) {
                valuePASS = valueThisPass;
                bestPass = tm;
            }
        }
        let valueDRIBBLE = 0;
        {
            const dribbleDir = v2.norm(v2.sub(goalPos, player.pos));
            const projectedPos = {
                x: v2.clamp(player.pos.x + dribbleDir.x * player.maxSpeed * 0.4, 0, PITCH_W),
                y: v2.clamp(player.pos.y + dribbleDir.y * player.maxSpeed * 0.4, 0, PITCH_H),
            };
            const projectedVal = this._positionValue(projectedPos, goalPos, opponents);
            const dribbleFeasible = Math.pow(1 - pressure, 1.5) * (player.stats.pace / 100);
            const posGain = v2.clamp(projectedVal - myPosVal, 0, 1);
            valueDRIBBLE = (myPosVal * 0.4 + posGain * 0.6) * dribbleFeasible;
        }
        const vShoot = valueSHOOT + this.rng.range(0, 0.08);
        const vPass = valuePASS + this.rng.range(0, 0.08);
        const vDribble = valueDRIBBLE + this.rng.range(0, 0.06);
        if (vShoot >= vPass && vShoot >= vDribble && valueSHOOT > 0.05) {
            this._shoot(player, goalPos);
        }
        else if (vPass >= vDribble && bestPass && valuePASS > 0.05) {
            this._pass(player, bestPass);
        }
        else {
            const dir = v2.norm(v2.sub(goalPos, player.pos));
            player.targetPos = v2.add(player.pos, v2.scale(dir, 55 + this.rng.range(0, 35)));
            player.state = STATES.MOVING;
        }
    }
    _positionValue(pos, goalPos, opponents) {
        const distToGoal = v2.dist(pos, goalPos);
        const maxDist = PITCH_W * 0.95;
        const distScore = 1 - v2.clamp(distToGoal / maxDist, 0, 1);
        const angleRad = Math.atan2(GOAL_W * 0.5, Math.max(distToGoal, 1));
        const angleScore = v2.clamp(angleRad / (Math.PI / 3), 0, 1);
        let pressureHere = 0;
        for (const op of opponents) {
            const d = v2.dist(op.pos, pos);
            if (d < AWARENESS_R)
                pressureHere += 1 / Math.max(d * d, 1);
        }
        pressureHere = v2.clamp(pressureHere * 2000, 0, 1);
        const openScore = 1 - pressureHere;
        return distScore * 0.55 + angleScore * 0.3 + openScore * 0.15;
    }
    _progressValue(from, to) {
        if (from.x === to.x && from.y === to.y)
            return 0;
        return v2.clamp((to.x - from.x) / 200, -0.3, 1);
    }
    _receiverOpenness(receiver, opponents) {
        let minD = Infinity;
        for (const op of opponents) {
            const d = v2.dist(op.pos, receiver.pos);
            if (d < minD)
                minD = d;
        }
        return v2.clamp(minD / 100, 0, 1);
    }
    _interceptRisk(from, to, opponents) {
        const lineDir = v2.norm(v2.sub(to, from));
        const lineLen = v2.dist(from, to);
        let maxRisk = 0;
        for (const op of opponents) {
            const toOp = v2.sub(op.pos, from);
            const proj = v2.clamp(v2.dot(toOp, lineDir), 0, lineLen);
            const closest = v2.add(from, v2.scale(lineDir, proj));
            const dist = v2.dist(op.pos, closest);
            const risk = v2.clamp(1 - dist / 55, 0, 1);
            if (risk > maxRisk)
                maxRisk = risk;
        }
        return maxRisk;
    }
    _isLineClearRadius(from, to, opponents, radius) {
        const lineDir = v2.norm(v2.sub(to, from));
        const lineLen = v2.dist(from, to);
        for (const op of opponents) {
            const toOp = v2.sub(op.pos, from);
            const proj = v2.clamp(v2.dot(toOp, lineDir), 0, lineLen);
            const closest = v2.add(from, v2.scale(lineDir, proj));
            const dist = v2.dist(op.pos, closest);
            if (dist < radius)
                return false;
        }
        return true;
    }
    _inOwnHalf(player) {
        return player.team === 'A' ? player.pos.x < PITCH_W / 2 : player.pos.x > PITCH_W / 2;
    }
    _doClearance(player, teammates) {
        const ball = this.ball;
        let bestTarget = null;
        let bestScore = -Infinity;
        for (const tm of teammates) {
            const forward = player.team === 'A' ? tm.pos.x : PITCH_W - tm.pos.x;
            const dist = v2.dist(player.pos, tm.pos);
            const score = forward * 0.002 - dist * 0.001;
            if (score > bestScore) {
                bestScore = score;
                bestTarget = tm;
            }
        }
        const attackingRight = player.team === 'A';
        const clearTarget = bestTarget
            ? {
                x: v2.clamp(bestTarget.pos.x + (attackingRight ? 40 : -40) + this.rng.range(-20, 20), 20, PITCH_W - 20),
                y: v2.clamp(bestTarget.pos.y + this.rng.range(-25, 25), 20, PITCH_H - 20),
            }
            : {
                x: attackingRight ? PITCH_W * 0.75 : PITCH_W * 0.25,
                y: PITCH_H / 2 + this.rng.range(-60, 60),
            };
        const speed = 340 + this.rng.range(0, 60);
        const peakZ = 130 + this.rng.range(0, 40);
        player.hasBall = false;
        ball.owner = null;
        ball.lastKicker = player;
        ball.launchAerial(player.pos, clearTarget, speed, peakZ);
        player.clearanceCooldown = 1.8;
        if (bestTarget) {
            bestTarget.state = STATES.RECEIVING;
            bestTarget.receivingTarget = { ...clearTarget };
            bestTarget.targetPos = { ...clearTarget };
        }
        this.events.push({ type: 'CLEARANCE', data: { playerId: player.id }, timestamp: this.clockSec });
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
        for (let i = 0; i < this.allPlayers.length; i += 1) {
            for (let j = i + 1; j < this.allPlayers.length; j += 1) {
                const a = this.allPlayers[i];
                const b = this.allPlayers[j];
                const d = v2.dist(a.pos, b.pos);
                if (d < SEPARATION_RADIUS && d > 0.1) {
                    const push = v2.scale(v2.norm(v2.sub(a.pos, b.pos)), (SEPARATION_RADIUS - d) * 0.5);
                    a.vel = v2.add(a.vel, push);
                    b.vel = v2.sub(b.vel, push);
                }
            }
        }
    }
    _checkPickup() {
        const ball = this.ball;
        const ballSpd = v2.len(ball.vel);
        const lastKicker = ball.lastKicker;
        for (const p of this.allPlayers) {
            if (p.state === STATES.SHOOTING)
                continue;
            const d = v2.dist(p.pos, ball.pos);
            const pickupRadius = ballSpd < 60 ? 22 : 14;
            if (d > pickupRadius + PLAYER_RADIUS)
                continue;
            const maxPickupZ = p.role === ROLES.GK ? Z_PICKUP * 1.6 : Z_PICKUP;
            if (ball.z > maxPickupZ)
                continue;
            if (p.role === ROLES.GK) {
                const shootDir = v2.norm(ball.vel);
                const toGoal = v2.norm(v2.sub({ x: p.team === 'A' ? 0 : PITCH_W, y: PITCH_H / 2 }, ball.pos));
                const itsAShot = v2.dot(shootDir, toGoal) > 0.5;
                const saveProb = (p.stats.reflexes / 100) * 0.85;
                if (itsAShot && lastKicker && lastKicker.team !== p.team) {
                    if (this.rng.chance(saveProb)) {
                        this.events.push({ type: 'SAVE', data: { playerId: p.id }, timestamp: this.clockSec });
                        p.hasBall = true;
                        p.state = STATES.WITH_BALL;
                        ball.owner = p;
                        ball.vel = { x: 0, y: 0 };
                        ball.vz = 0;
                        ball.z = 0;
                        ball.inFlight = false;
                        ball.isAerial = false;
                        p.decisionTimer = 0;
                    }
                    return;
                }
            }
            if (ball.inFlight && ballSpd > 40) {
                const isDesignatedReceiver = p.state === STATES.RECEIVING &&
                    Boolean(p.receivingTarget) &&
                    d < pickupRadius + PLAYER_RADIUS;
                const isOpponentIntercepting = Boolean(lastKicker) &&
                    lastKicker?.team !== p.team &&
                    d < 18 &&
                    !ball.isAerial;
                if (!isDesignatedReceiver && !isOpponentIntercepting)
                    continue;
            }
            p.hasBall = true;
            p.state = STATES.WITH_BALL;
            ball.owner = p;
            ball.vel = { x: 0, y: 0 };
            ball.vz = 0;
            ball.z = 0;
            ball.inFlight = false;
            ball.isAerial = false;
            p.decisionTimer = 0;
            p.receivingTarget = null;
            return;
        }
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
        this.allPlayers.forEach(p => {
            p.hasBall = false;
            p.targetPos = { ...p.homePos };
        });
        this._kickoff();
    }
    _checkBallOut() {
        const out = this.ball.pos.x < 0 || this.ball.pos.x > PITCH_W || this.ball.pos.y < 0 || this.ball.pos.y > PITCH_H;
        if (!out)
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