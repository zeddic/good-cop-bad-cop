/**
 * Memoizes a function with only its latest results. (ie a cache size of 1)
 *
 * This will continue to return the same result as long as arguments are
 * the same using strict equality by default.
 *
 * Based off of reselect:
 * https://github.com/reduxjs/reselect
 */
export function memoize<F extends Function>(
  func: F,
  equalityCheck: EqualityFn = strictEqualityCheck
): F {
  let lastArgs: IArguments | undefined;
  let lastResult: unknown | undefined;

  const memoized = function () {
    if (!areArgumentsEqual(equalityCheck, lastArgs, arguments)) {
      lastResult = func.apply(null, arguments);
    }

    lastArgs = arguments;
    return lastResult;
  };

  return (memoized as {}) as F;
}

interface EqualityFn {
  (a: {}, b: {}): boolean;
}

function strictEqualityCheck(a: any, b: any) {
  return a === b;
}

function areArgumentsEqual(
  equalityCheck: EqualityFn,
  prev: IArguments | undefined,
  next: IArguments
) {
  if (prev === null || next === null || prev?.length !== next.length) {
    return false;
  }

  const length = prev.length;
  for (let i = 0; i < length; i++) {
    if (!equalityCheck(prev[i], next[i])) {
      return false;
    }
  }

  return true;
}
