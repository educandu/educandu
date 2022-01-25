import moment from 'moment';

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

const translateTimeUnit = (timeUnit, t, translationKey) => {
  return timeUnit ? t(`common:${translationKey}`, { timeUnit }) : null;
};

const getTranslatedTimeUntil = ({ from, until, t }) => {
  const timeUntil = moment.duration(moment(until).diff(moment(from)));

  const parts = [
    translateTimeUnit(timeUntil.years(), t, 'year'),
    translateTimeUnit(timeUntil.months(), t, 'month'),
    translateTimeUnit(timeUntil.days(), t, 'day'),
    translateTimeUnit(timeUntil.hours(), t, 'hour'),
    translateTimeUnit(timeUntil.minutes(), t, 'minute')
  ].filter(part => part);

  if (!parts.length) {
    return t('common:now');
  }

  return `${t('common:in')} ${parts.join(', ')}`;
};

export default {
  determineUpcomingLesson,
  getTranslatedTimeUntil
};
