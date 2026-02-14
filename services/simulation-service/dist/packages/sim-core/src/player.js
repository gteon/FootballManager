import { v2 } from './vector';
import { DECISION_INTERVAL, PLAYER_RADIUS, PITCH_W, PITCH_H, GRAVITY, BOUNCE_DAMP } from './constants';
export class Player {
    id;
    team;
    role;
    homePos;
    stats;
    maxSpeed;
    pos;
    vel;
    targetPos;
    state;
    decisionTimer;
    hasBall;
    receivingTarget;
    stateTimer;
    clearanceCooldown;
    constructor(id, team, role, homePos, stats, rng) {
        this.id = id;
        this.team = team;
        this.role = role;
        this.homePos = { ...homePos };
        this.pos = { ...homePos };
        this.vel = { x: 0, y: 0 };
        this.targetPos = { ...homePos };
        this.state = 'IDLE';
        this.stats = stats;
        this.decisionTimer = rng.range(0, DECISION_INTERVAL);
        this.hasBall = false;
        this.receivingTarget = null;
        this.stateTimer = 0;
        this.maxSpeed = 100 + stats.pace * 1.2;
        this.clearanceCooldown = 0;
    }
    update(dt, ball, teammates, opponents) {
        this.stateTimer += dt;
        this.decisionTimer -= dt;
        if (this.clearanceCooldown > 0)
            this.clearanceCooldown -= dt;
        this._steer(dt);
        if (this.hasBall && ball.owner === this) {
            ball.pos = { x: this.pos.x, y: this.pos.y };
            ball.vel = { x: 0, y: 0 };
            ball.z = 0;
            ball.vz = 0;
        }
    }
    _steer(dt) {
        const toTarget = v2.sub(this.targetPos, this.pos);
        const dist = v2.len(toTarget);
        const desired = v2.scale(v2.norm(toTarget), this.maxSpeed);
        const steering = v2.sub(desired, this.vel);
        const approachFactor = dist < 40 ? dist / 40 : 1;
        this.vel = v2.add(this.vel, v2.scale(steering, 0.12 * approachFactor));
        const spd = v2.len(this.vel);
        if (spd > this.maxSpeed) {
            this.vel = v2.scale(v2.norm(this.vel), this.maxSpeed);
        }
        if (dist < 3) {
            this.vel = v2.scale(this.vel, 0.6);
        }
        this.pos = v2.add(this.pos, v2.scale(this.vel, dt));
        this.pos.x = v2.clamp(this.pos.x, PLAYER_RADIUS, PITCH_W - PLAYER_RADIUS);
        this.pos.y = v2.clamp(this.pos.y, PLAYER_RADIUS, PITCH_H - PLAYER_RADIUS);
    }
}
export class Ball {
    pos;
    vel;
    z;
    vz;
    owner;
    inFlight;
    isAerial;
    target;
    lastKicker;
    bounceCount;
    constructor() {
        this.pos = { x: 450, y: 260 };
        this.vel = { x: 0, y: 0 };
        this.z = 0;
        this.vz = 0;
        this.owner = null;
        this.inFlight = false;
        this.isAerial = false;
        this.target = null;
        this.lastKicker = null;
        this.bounceCount = 0;
    }
    update(dt) {
        if (this.owner)
            return;
        this.pos = v2.add(this.pos, v2.scale(this.vel, dt));
        const spd = v2.len(this.vel);
        if (this.z > 1) {
            this.vel = v2.scale(this.vel, Math.pow(1 - 0.008, dt * 60));
        }
        else {
            if (spd > 8) {
                const fr = spd > 200 ? 0.035 * 1.2 : 0.035;
                this.vel = v2.scale(this.vel, Math.pow(1 - fr, dt * 60));
            }
            else {
                this.vel = v2.scale(this.vel, 0.8);
                if (spd < 1.5) {
                    this.vel = { x: 0, y: 0 };
                    this.inFlight = false;
                    this.isAerial = false;
                }
            }
        }
        if (this.z > 0 || this.vz > 0) {
            this.vz -= GRAVITY * dt;
            this.z += this.vz * dt;
            if (this.z <= 0) {
                this.z = 0;
                if (Math.abs(this.vz) > 30) {
                    this.vz = -this.vz * BOUNCE_DAMP;
                    this.vel = v2.scale(this.vel, 0.82);
                    this.bounceCount++;
                    if (this.bounceCount >= 2 || Math.abs(this.vz) < 40) {
                        this.vz = 0;
                        this.isAerial = false;
                    }
                }
                else {
                    this.vz = 0;
                    this.z = 0;
                    this.isAerial = false;
                }
            }
        }
    }
    launchGround(from, to, speed) {
        const dir = v2.norm(v2.sub(to, from));
        this.vel = v2.scale(dir, speed);
        this.z = 0;
        this.vz = 0;
        this.inFlight = true;
        this.isAerial = false;
        this.bounceCount = 0;
    }
    launchAerial(from, to, speed, peakZ) {
        const dir = v2.norm(v2.sub(to, from));
        this.vel = v2.scale(dir, speed);
        this.vz = Math.sqrt(2 * GRAVITY * peakZ);
        this.z = 2;
        this.inFlight = true;
        this.isAerial = true;
        this.bounceCount = 0;
    }
}
//# sourceMappingURL=player.js.map