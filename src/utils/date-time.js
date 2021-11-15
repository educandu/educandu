import { add } from 'date-fns';

export function now() {
  return new Date();
}

export function nowUTC() {
  const localDate = new Date();
  return add(localDate, { minutes: localDate.getTimezoneOffset() });
}

export default {
  now,
  nowUTC
};
