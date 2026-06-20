// Tests for the v0 stub calculator core (CALC-F04).
//
// They exercise the command façade end-to-end: entry editing, stack-lift,
// every operator/function/constant/stack op, each of the four error classes
// (non-destructively), the angle mode, the one-shot shift layer, and the
// invariant that no snapshot ever carries a non-finite value.

import { describe, expect, it } from 'vitest';

import { AngleMode } from '@calc/core';

import {
  Cmd,
  type CalcState,
  type CalculatorCore,
  type Command,
  type Digit,
} from './contract.js';
import { ERROR_MESSAGES } from './errors.js';
import { StubCalculatorCore } from './stub-core.js';

/** Apply a sequence of commands and return the final state. */
function run(core: CalculatorCore, ...commands: Command[]): CalcState {
  let state = core.state;
  for (const command of commands) state = core.apply(command);
  return state;
}

/** Type a multi-digit integer string as individual digit commands. */
function digits(text: string): Command[] {
  return [...text].map((d) => Cmd.digit(Number(d) as Digit));
}

describe('entry-line editing', () => {
  it('builds a multi-digit entry from digit commands', () => {
    const state = run(new StubCalculatorCore(), ...digits('123'));
    expect(state.entry).toBe('123');
    expect(state.stack).toEqual([]);
  });

  it('starts a decimal entry as 0. and ignores a second point', () => {
    const core = new StubCalculatorCore();
    expect(run(core, Cmd.decimal()).entry).toBe('0.'); // fresh '.' → '0.'
    expect(run(core, ...digits('5')).entry).toBe('0.5'); // → '0.5'
    expect(run(core, Cmd.decimal()).entry).toBe('0.5'); // second '.' ignored
  });

  it('backspace deletes the last character; on an empty line it is a no-op', () => {
    const core = new StubCalculatorCore();
    expect(run(core, ...digits('12'), Cmd.backspace()).entry).toBe('1');
    expect(run(core, Cmd.backspace()).entry).toBe('');
    // Already empty: still a no-op, no error, stack untouched.
    const state = run(core, Cmd.backspace());
    expect(state.entry).toBe('');
    expect(state.error).toBeNull();
    expect(state.stack).toEqual([]);
  });

  it('clearEntry empties the in-progress entry', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('123'),
      Cmd.clearEntry(),
    );
    expect(state.entry).toBe('');
  });

  it('CHS flips the sign of the in-progress entry and back', () => {
    const core = new StubCalculatorCore();
    expect(run(core, ...digits('5'), Cmd.chs()).entry).toBe('-5');
    expect(run(core, Cmd.chs()).entry).toBe('5');
  });
});

describe('ENTER and stack-lift', () => {
  it('ENTER pushes the entry to level 1 and clears the entry line', () => {
    const state = run(new StubCalculatorCore(), ...digits('42'), Cmd.enter());
    expect(state.stack).toEqual([42]);
    expect(state.entry).toBe('');
  });

  it('numbers a deeper stack with level 1 (X) first', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('1'),
      Cmd.enter(),
      ...digits('2'),
      Cmd.enter(),
      ...digits('3'),
      Cmd.enter(),
    );
    expect(state.stack).toEqual([3, 2, 1]);
  });

  it('ENTER on an empty entry line is a no-op (no duplication)', () => {
    const core = new StubCalculatorCore();
    run(core, ...digits('5'), Cmd.enter());
    const state = run(core, Cmd.enter());
    expect(state.stack).toEqual([5]);
  });

  it('an operator commits the in-progress entry first (stack-lift)', () => {
    // 3 ENTER 4 +  →  no explicit ENTER before +; the + lifts the typed 4.
    const state = run(
      new StubCalculatorCore(),
      ...digits('3'),
      Cmd.enter(),
      ...digits('4'),
      Cmd.binary('add'),
    );
    expect(state.stack).toEqual([7]);
    expect(state.entry).toBe('');
  });
});

describe('binary operators (operand order)', () => {
  it('subtracts level2 − level1', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('10'),
      Cmd.enter(),
      ...digits('3'),
      Cmd.binary('subtract'),
    );
    expect(state.stack).toEqual([7]);
  });

  it('divides level2 ÷ level1', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('10'),
      Cmd.enter(),
      ...digits('2'),
      Cmd.binary('divide'),
    );
    expect(state.stack).toEqual([5]);
  });

  it('raises level2 to the level1 power (yˣ)', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('2'),
      Cmd.enter(),
      ...digits('10'),
      Cmd.binary('power'),
    );
    expect(state.stack).toEqual([1024]);
  });
});

describe('unary functions and constants', () => {
  const x = (...commands: Command[]): number =>
    run(new StubCalculatorCore(), ...commands).stack[0];

  it('computes sqrt, square, and reciprocal', () => {
    expect(x(...digits('9'), Cmd.unary('sqrt'))).toBe(3);
    expect(x(...digits('3'), Cmd.unary('square'))).toBe(9);
    expect(x(...digits('4'), Cmd.unary('reciprocal'))).toBe(0.25);
  });

  it('computes factorial and percent', () => {
    expect(x(...digits('5'), Cmd.unary('factorial'))).toBe(120);
    expect(x(...digits('50'), Cmd.unary('percent'))).toBe(0.5);
  });

  it('computes eˣ and 10ˣ', () => {
    expect(x(...digits('1'), Cmd.unary('exp'))).toBeCloseTo(Math.E, 12);
    expect(x(...digits('2'), Cmd.unary('exp10'))).toBe(100);
  });

  it('computes ln and log10', () => {
    expect(x(Cmd.constant('e'), Cmd.unary('ln'))).toBeCloseTo(1, 12);
    expect(x(...digits('1000'), Cmd.unary('log10'))).toBeCloseTo(3, 12);
  });

  it('pushes π and e as the raw IEEE-754 constants', () => {
    expect(x(Cmd.constant('pi'))).toBe(Math.PI);
    expect(x(Cmd.constant('e'))).toBe(Math.E);
  });

  it('CHS with no entry negates the level-1 value', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('5'),
      Cmd.enter(),
      Cmd.chs(),
    );
    expect(state.stack).toEqual([-5]);
  });
});

describe('stack operations', () => {
  it('DUP duplicates level 1', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('5'),
      Cmd.stack('dup'),
    );
    expect(state.stack).toEqual([5, 5]);
  });

  it('SWAP exchanges levels 1 and 2', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('1'),
      Cmd.enter(),
      ...digits('2'),
      Cmd.stack('swap'),
    );
    expect(state.stack).toEqual([1, 2]);
  });

  it('DROP discards level 1', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('1'),
      Cmd.enter(),
      ...digits('2'),
      Cmd.stack('drop'),
    );
    expect(state.stack).toEqual([1]);
  });
});

describe('angle mode (FR16/FR17/AC4)', () => {
  it('defaults to Degrees (DEG)', () => {
    expect(new StubCalculatorCore().state.angleMode).toBe(AngleMode.Degrees);
  });

  it('interprets sin in the active mode', () => {
    const deg = run(
      new StubCalculatorCore(),
      ...digits('90'),
      Cmd.unary('sin'),
    );
    expect(deg.stack[0]).toBeCloseTo(1, 12);

    const rad = run(
      new StubCalculatorCore({ angleMode: AngleMode.Radians }),
      ...digits('90'),
      Cmd.unary('sin'),
    );
    expect(rad.stack[0]).toBeCloseTo(Math.sin(90), 12);
  });

  it('switches mode without disturbing the in-progress entry', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('12'),
      Cmd.setAngleMode(AngleMode.Radians),
    );
    expect(state.angleMode).toBe(AngleMode.Radians);
    expect(state.entry).toBe('12');
  });
});

describe('shift layer (FR3)', () => {
  it('toggleShift turns the layer on, and any other key consumes it', () => {
    const core = new StubCalculatorCore();
    expect(run(core, Cmd.toggleShift()).shift).toBe(true);
    // A subsequent command resets the one-shot layer.
    expect(run(core, Cmd.digit(1)).shift).toBe(false);
  });

  it('toggleShift twice returns to off', () => {
    const core = new StubCalculatorCore();
    run(core, Cmd.toggleShift());
    expect(run(core, Cmd.toggleShift()).shift).toBe(false);
  });
});

describe('error classes are non-destructive (FR19/FR21/AC5)', () => {
  it('DIV_ZERO on a finite/zero divide, stack unchanged', () => {
    const core = new StubCalculatorCore();
    run(core, ...digits('1'), Cmd.enter(), ...digits('0'), Cmd.enter());
    const before = core.state.stack;
    const state = core.apply(Cmd.binary('divide'));
    expect(state.error?.code).toBe('DIV_ZERO');
    expect(state.error?.message).toBe(ERROR_MESSAGES.DIV_ZERO);
    expect(state.stack).toEqual(before);
  });

  it('DOMAIN for sqrt of a negative', () => {
    const state = run(
      new StubCalculatorCore(),
      ...digits('4'),
      Cmd.chs(),
      Cmd.enter(),
      Cmd.unary('sqrt'),
    );
    expect(state.error?.code).toBe('DOMAIN');
    expect(state.error?.message).toBe(ERROR_MESSAGES.DOMAIN);
    expect(state.stack).toEqual([-4]);
  });

  it('DOMAIN for ln of 0, asin out of range, 0/0, and non-integer factorial', () => {
    const ln0 = run(
      new StubCalculatorCore(),
      ...digits('0'),
      Cmd.enter(),
      Cmd.unary('ln'),
    );
    expect(ln0.error?.code).toBe('DOMAIN');

    const asin2 = run(
      new StubCalculatorCore(),
      ...digits('2'),
      Cmd.enter(),
      Cmd.unary('asin'),
    );
    expect(asin2.error?.code).toBe('DOMAIN');

    // 0/0 is Indeterminate in the core; it surfaces to the UI as DOMAIN.
    const zeroOverZero = run(
      new StubCalculatorCore(),
      ...digits('0'),
      Cmd.enter(),
      ...digits('0'),
      Cmd.enter(),
      Cmd.binary('divide'),
    );
    expect(zeroOverZero.error?.code).toBe('DOMAIN');

    const fact = run(
      new StubCalculatorCore(),
      ...digits('2'),
      Cmd.decimal(),
      ...digits('5'),
      Cmd.enter(),
      Cmd.unary('factorial'),
    );
    expect(fact.error?.code).toBe('DOMAIN');
  });

  it('OVERFLOW for a non-finite result, stack unchanged', () => {
    const core = new StubCalculatorCore();
    run(core, ...digits('1000'), Cmd.enter());
    const before = core.state.stack;
    const state = core.apply(Cmd.unary('exp'));
    expect(state.error?.code).toBe('OVERFLOW');
    expect(state.error?.message).toBe(ERROR_MESSAGES.OVERFLOW);
    expect(state.stack).toEqual(before);
  });

  it('UNDERFLOW for a binary op, a unary op, and a stack op with too few operands', () => {
    const binary = run(
      new StubCalculatorCore(),
      ...digits('5'),
      Cmd.enter(),
      Cmd.binary('add'),
    );
    expect(binary.error?.code).toBe('UNDERFLOW');
    expect(binary.error?.message).toBe(ERROR_MESSAGES.UNDERFLOW);
    expect(binary.stack).toEqual([5]);

    expect(run(new StubCalculatorCore(), Cmd.unary('sqrt')).error?.code).toBe(
      'UNDERFLOW',
    );
    expect(run(new StubCalculatorCore(), Cmd.stack('drop')).error?.code).toBe(
      'UNDERFLOW',
    );
    expect(run(new StubCalculatorCore(), Cmd.stack('swap')).error?.code).toBe(
      'UNDERFLOW',
    );
  });

  it('an error is transient: the next keypress dismisses it and is processed', () => {
    const core = new StubCalculatorCore();
    expect(core.apply(Cmd.binary('add')).error?.code).toBe('UNDERFLOW');
    const next = core.apply(Cmd.digit(5));
    expect(next.error).toBeNull();
    expect(next.entry).toBe('5');
  });
});

describe('never-leak-NaN/Infinity invariant (FR19)', () => {
  it('keeps every snapshot stack finite across a battery of operations', () => {
    const core = new StubCalculatorCore();
    const battery: Command[] = [
      ...digits('1000'),
      Cmd.enter(),
      Cmd.unary('exp'), // overflow attempt — must not push Infinity
      ...digits('0'),
      Cmd.enter(),
      Cmd.unary('reciprocal'), // 1/0 — must not push Infinity
      Cmd.constant('pi'),
      Cmd.unary('tan'), // near-singularity — must not push Infinity
      ...digits('1'),
      Cmd.enter(),
      ...digits('0'),
      Cmd.binary('divide'), // divide-by-zero
    ];
    for (const command of battery) {
      const state = core.apply(command);
      for (const value of state.stack) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });
});

describe('CalculatorCore conformance', () => {
  it('exposes a state getter and an apply returning a full snapshot', () => {
    const core: CalculatorCore = new StubCalculatorCore();
    expect(core.state).toEqual({
      stack: [],
      entry: '',
      angleMode: AngleMode.Degrees,
      shift: false,
      error: null,
    });
    const state = core.apply(Cmd.digit(7));
    expect(state).toMatchObject({ entry: '7', stack: [], error: null });
  });
});
