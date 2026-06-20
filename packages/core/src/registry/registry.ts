// The function registry (CALC-F02, FR22): register operators and look them up
// by name. This is the library's extension seam — the single place that decides
// "which operators exist" — so future operators (a Gamma-extended factorial) or
// future angle modes (GRAD) are drop-in additions that never touch the
// `apply(args, mode)` contract consumers depend on (AC12).
//
// A `Registry` is a thin, ordered name->operator map. The shared `defaultRegistry`
// holds the v0 catalogue; tests and future hosts can build their own (e.g. with a
// swapped factorial) and hand it to a `CalcCore` without any other change.

import type { Operator } from './operators.js';
import { OPERATORS } from './operators.js';

/**
 * A mutable collection of operators keyed by `name`. Registration is
 * last-write-wins, so registering an operator whose name already exists swaps
 * the implementation in place — the mechanism behind the AC12 "swap factorial"
 * extensibility guarantee.
 */
export class Registry {
  private readonly operators = new Map<string, Operator>();

  /** Build a registry seeded with the given operators (none by default). */
  constructor(operators: readonly Operator[] = []) {
    for (const op of operators) this.register(op);
  }

  /**
   * Add (or replace, by name) an operator. Returns `this` so registrations can
   * be chained. Replacing an existing name is intentional: it is how a host
   * substitutes an implementation without disturbing the apply contract.
   */
  register(operator: Operator): this {
    this.operators.set(operator.name, operator);
    return this;
  }

  /** Look up an operator by name, or `undefined` if none is registered. */
  get(name: string): Operator | undefined {
    return this.operators.get(name);
  }

  /** True iff an operator is registered under `name`. */
  has(name: string): boolean {
    return this.operators.has(name);
  }

  /** The names of all registered operators, in insertion order. */
  names(): string[] {
    return [...this.operators.keys()];
  }
}

/**
 * The registry of the v0 operator set, used by default when a `CalcCore` is
 * constructed without one. It is a single shared instance; a host that wants to
 * extend or swap operators in isolation should build its own
 * `new Registry([...OPERATORS, extra])` (or seed an empty one) and pass that to
 * the core, rather than mutating this shared default.
 */
export const defaultRegistry = new Registry(OPERATORS);
