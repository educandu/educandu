import { DAY_OF_WEEK } from '../domain/constants.js';

export function getDayOfWeek(date) {
  const day = date.getDay();
  switch (day) {
    case 0:
      return DAY_OF_WEEK.sunday;
    case 1:
      return DAY_OF_WEEK.monday;
    case 2:
      return DAY_OF_WEEK.tuesday;
    case 3:
      return DAY_OF_WEEK.wednesday;
    case 4:
      return DAY_OF_WEEK.thursday;
    case 5:
      return DAY_OF_WEEK.friday;
    case 6:
      return DAY_OF_WEEK.saturday;
    default:
      return null;
  }
}
