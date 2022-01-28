import { isBrowser } from '../ui/browser-helper.js';

export async function resolveAll(promiseCreators) {
  // eslint-disable-next-line no-process-env
  if (!isBrowser() && process.env.EDUCANDU_TEST === true.toString()) {
    // Resolve promises that dynamically import
    // modules sequentially in the test runner,
    // because otherwise Jest bursts into flames:
    // https://github.com/facebook/jest/issues/11434
    const results = [];
    for (const promiseCreator of promiseCreators) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await promiseCreator());
    }
    return results;
  }

  // Otherwise we can resolve everything in parallel:
  return Promise.all(promiseCreators.map(promiseCreator => promiseCreator()));
}
