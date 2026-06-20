// The calculator core instance (CALC-F02): the stateful façade consumers (F03)
// hold to apply operators.
//
// A `CalcCore` owns exactly one piece of mutable state — the persistent
// angle mode (FR19) — and delegates everything else to an injected operator
// `Registry`. `apply(name, args)` is the single entry point F03 uses: it looks
// the operator up, threads in the current angle mode, and returns the shared
// `Result<number>`. Because both the registry and the angle mode are injected
// and read uniformly, adding an operator or an angle mode never changes this
// surface (AC12).

import type { Result } from './contract/result.js';
import { AngleMode, DEFAULT_ANGLE_MODE } from './contract/angle-mode.js';
import { Registry, defaultRegistry } from './registry/registry.js';

/** Optional construction settings for a {@link CalcCore}. */
export interface CalcCoreOptions {
  /** Initial angle mode (default {@link DEFAULT_ANGLE_MODE}, i.e. Degrees). */
  readonly angleMode?: AngleMode;
  /**
   * Operator registry backing `apply` (defaults to the shared v0
   * {@link defaultRegistry}). Inject a custom registry to add or swap operators
   * — the apply contract is unchanged (AC12).
   */
  readonly registry?: Registry;
}

/**
 * A calculator core: a persistent angle mode plus a registry-backed
 * operator-application surface. Construct one per consumer; the angle mode is
 * an instance setting, not a per-call argument (FR19).
 */
export class CalcCore {
  private mode: AngleMode;
  private readonly registry: Registry;

  constructor(options: CalcCoreOptions = {}) {
    this.mode = options.angleMode ?? DEFAULT_ANGLE_MODE;
    this.registry = options.registry ?? defaultRegistry;
  }

  /** The current angle mode read by every trig / inverse-trig operator. */
  get angleMode(): AngleMode {
    return this.mode;
  }

  /**
   * Set the persistent angle mode. The single lever that changes how trig
   * operators interpret inputs and express outputs (FR13/FR19); it takes effect
   * for every subsequent `apply` of a trig operator.
   */
  setAngleMode(mode: AngleMode): void {
    this.mode = mode;
  }

  /** True iff an operator is registered under `name`. */
  has(name: string): boolean {
    return this.registry.has(name);
  }

  /** The names of all registered operators. */
  operatorNames(): string[] {
    return this.registry.names();
  }

  /**
   * Apply the operator registered under `name` to `args`, threading in the
   * current angle mode, and return its `Result<number>`.
   *
   * Operator-level failures surface as a typed `CalcError` in the `Result` (the
   * five-kind taxonomy, never a NaN/Infinity — FR20/AC7). An *unknown* operator
   * name is a different class of problem: it is a programming error, not one of
   * the closed calculation kinds, so it throws rather than being smuggled into
   * the error taxonomy.
   */
  apply(name: string, args: number[]): Result<number> {
    const operator = this.registry.get(name);
    if (operator === undefined) {
      throw new Error(`unknown operator: '${name}'`);
    }
    return operator.apply(args, this.mode);
  }
}
