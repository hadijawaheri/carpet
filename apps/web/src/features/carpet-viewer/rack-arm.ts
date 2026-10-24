/** Keep simulating this long after an arm stops, so the carpet's swing dies out on its own. */
const SETTLE_SECONDS = 4;
/** Spring rate of the arm: an unhurried hand turning the page. */
const OMEGA = 3.2;
/**
 * rad/s. A seller walks a heavy carpet over; turned faster, the free edge would fly up like a
 * flag, since the solver has no air to hold it back.
 */
const MAX_SPEED = 1.7;

/**
 * One swinging arm of a carpet rack: its angle about the pole eases towards a target like a
 * page being turned by hand. Plain state with methods so React Compiler leaves it alone.
 */
export class RackArm {
  angle: number;
  private velocity = 0;
  private target: number;
  private delay = 0;
  private settle = 0;
  /** The front carpet keeps simulating even at rest, so a grab answers at once. */
  front = false;
  /** Arms on either side on the pole; their carpets bound how far this one may swing. */
  private below: RackArm | null = null;
  private above: RackArm | null = null;

  constructor(angle: number) {
    this.angle = angle;
    this.target = angle;
  }

  /** Turns towards `angle` after `delay` seconds; a staggered delay fans several pages over. */
  turnTo(angle: number, delay = 0) {
    if (angle === this.target) return;
    this.target = angle;
    this.delay = delay;
    this.settle = SETTLE_SECONDS;
  }

  /** Links the arms of one rack in angle order, lowest angle first. */
  static chain(arms: RackArm[]) {
    arms.forEach((arm, i) => {
      arm.below = arms[i - 1] ?? null;
      arm.above = arms[i + 1] ?? null;
    });
  }

  /** Lowest angle this arm's carpet may swing to: halfway to the carpet below it. */
  get wedgeLow() {
    return this.below ? (this.below.angle + this.angle) / 2 : -Infinity;
  }

  /** Highest angle this arm's carpet may swing to: halfway to the carpet above it. */
  get wedgeHigh() {
    return this.above ? (this.above.angle + this.angle) / 2 : Infinity;
  }

  /** Jumps straight to the target, for reduced motion. */
  snap() {
    this.angle = this.target;
    this.velocity = 0;
  }

  update(dt: number) {
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    // Critically damped spring: a firm hand that neither overshoots nor creeps.
    const accel = OMEGA * OMEGA * (this.target - this.angle) - 2 * OMEGA * this.velocity;
    this.velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.velocity + accel * dt));
    this.angle += this.velocity * dt;
    if (Math.abs(this.target - this.angle) > 1e-3 || Math.abs(this.velocity) > 1e-3) {
      this.settle = SETTLE_SECONDS;
    } else {
      this.settle = Math.max(0, this.settle - dt);
    }
  }

  /** Whether the cloth on this arm still needs simulating. */
  get active() {
    return this.front || this.settle > 0 || this.delay > 0;
  }
}

/** Fan of the waiting carpets behind the front one, and of the turned ones on the far side. */
const FAN_STEP = 0.13;
const FAN_LIMIT = 0.52;
/** A turned carpet rests short of a full half turn, so its knotted back faces the viewer. */
const TURNED = -(Math.PI - 0.72);

/**
 * Rack angle for the carpet at `position` when `current` is in front. Waiting carpets fan
 * backwards behind it; turned ones lie on the other side of the pole, most recent on top.
 */
export function rackAngle(position: number, current: number) {
  if (position >= current) return Math.min(FAN_LIMIT, (position - current) * FAN_STEP);
  return TURNED - Math.min(FAN_LIMIT, (current - 1 - position) * FAN_STEP);
}
