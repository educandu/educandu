export const isTaskSuccessful = task => task.processed && !task.attempts[task.attempts.length - 1].errors.length;

export const taskStatusSorter = (task1, task2) => {
  if (!task1.processed && !task2.processed) {
    return 0;
  }

  if (task1.processed && !task2.processed) {
    return 1;
  }

  if (!task1.processed && task2.processed) {
    return -1;
  }

  if (isTaskSuccessful(task1) && isTaskSuccessful(task2)) {
    return 0;
  }

  if (!isTaskSuccessful(task1) && !isTaskSuccessful(task2)) {
    return 0;
  }

  return isTaskSuccessful(task1) ? 1 : -1;
};
