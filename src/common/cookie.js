import cookie from 'js-cookie';
import { COOKIE_SAME_SITE_POLICY } from '../domain/constants.js';

const LONG_LASTING_COOKIE_EXPIRATION_TIME_IN_MS = 365 * 24 * 60 * 60 * 1000;

export function getLongLastingExpirationDateFromNow() {
  return new Date(new Date().getTime() + LONG_LASTING_COOKIE_EXPIRATION_TIME_IN_MS);
}

export function getCookie(name) {
  return cookie.get(name);
}

export function setLongLastingCookie(name, value) {
  cookie.set(name, value, { expires: getLongLastingExpirationDateFromNow(), sameSite: COOKIE_SAME_SITE_POLICY });
}

export function setSessionCookie(name, value) {
  cookie.set(name, value, { sameSite: COOKIE_SAME_SITE_POLICY });
}
