import { taskStatusSorter, isTaskSuccessful, doesTaskHaveErrors } from './task-utils.js';

const unprocessedTask = {
  processed: false
};

const erroredTask = {
  processed: true,
  attempts: [{ errors: ['This guy has errors'] }]
};

const successfulTask = {
  processed: true,
  attempts: [{ errors: ['Attempt with error'] }, { errors: [] }]
};

describe('doesTaskHaveErrors', () => {
  it('should return true for a task with errors', () => {
    expect(doesTaskHaveErrors(successfulTask)).toEqual(true);
  });

  it('should return false for a task with missing attempts', () => {
    expect(doesTaskHaveErrors({ })).toEqual(false);
  });

  it('should return false for a task without attempts', () => {
    expect(doesTaskHaveErrors({ attempts: [] })).toEqual(false);
  });

  it('should return false for a task without errors', () => {
    expect(doesTaskHaveErrors({ attempts: [{ errors: [] }] })).toEqual(false);
  });
});

describe('isTaskSuccessful', () => {
  it('should return false when the task is not processed', () => {
    expect(isTaskSuccessful(unprocessedTask)).toEqual(false);
  });

  it('should return false when the task has errors on the last attempt', () => {
    expect(isTaskSuccessful(erroredTask)).toEqual(false);
  });

  it('should return true when the task is processed and has no errors on the last attempt', () => {
    expect(isTaskSuccessful(erroredTask)).toEqual(false);
  });
});

describe('taskStatusSorter', () => {
  const testCases = [
    { description: 'unprocessed tasks', expectation: 'should be equal', input: [unprocessedTask, unprocessedTask], output: 0 },
    { description: 'errored tasks tasks', expectation: 'should be equal', input: [erroredTask, erroredTask], output: 0 },
    { description: 'successful tasks', expectation: 'should be equal', input: [successfulTask, successfulTask], output: 0 },
    { description: 'comparing unprocessed with errored', expectation: 'errored should be bigger', input: [unprocessedTask, erroredTask], output: -1 },
    { description: 'comparing errored with unprocessed', expectation: 'errored should be bigger', input: [erroredTask, unprocessedTask], output: 1 },
    { description: 'comparing unprocessed with successful', expectation: 'successful should be bigger', input: [unprocessedTask, successfulTask], output: -1 },
    { description: 'comparing successful with unprocessed', expectation: 'successful should be bigger', input: [successfulTask, unprocessedTask], output: 1 },
    { description: 'comparing errored with successful', expectation: 'successful should be bigger', input: [erroredTask, successfulTask], output: -1 },
    { description: 'comparing successful with errored', expectation: 'successful should be bigger', input: [successfulTask, erroredTask], output: 1 }
  ];
  testCases.forEach(({ description, expectation, input, output }) => {
    describe(description, () => {
      it(expectation, () => {
        const [task1, task2] = input;
        expect(taskStatusSorter(task1, task2)).toBe(output);
      });
    });
  });
});
