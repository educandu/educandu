const determineUpcomingLesson = (now, lessons) => {
  const timeOfChecking = now instanceof Date ? now.toISOString() : now;

  const upcomingLesson = lessons.find((lesson, index) => {
    const startsOn = lesson.schedule?.startsOn;

    const isFutureLesson = startsOn >= timeOfChecking;
    const previousLessonStartsOn = lessons[index - 1]?.schedule?.startsOn;
    const previousLessonWasPastLesson = !previousLessonStartsOn || previousLessonStartsOn < timeOfChecking;
    return isFutureLesson && previousLessonWasPastLesson;
  });

  return upcomingLesson;
};

export default {
  determineUpcomingLesson
};
