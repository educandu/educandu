// Copied from: https://urlregex.com/
// eslint-disable-next-line max-len
const URL_REGEX = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;

const URL_SECURE_PROTO_REGEX = /^https:\/\/.+$/;

export function validateUrl(url, t, { allowInsecure = false } = {}) {
  let validateStatus;
  let help;

  if (!url) {
    validateStatus = 'warning';
    help = t('validation:urlRequired');
  } else if (!URL_REGEX.test(url)) {
    validateStatus = 'error';
    help = t('validation:urlInvalid');
  } else if (!allowInsecure && !URL_SECURE_PROTO_REGEX.test(url)) {
    validateStatus = 'error';
    help = t('validation:urlInsecure');
  } else {
    validateStatus = 'success';
    help = null;
  }

  return { validateStatus, help };
}

export default {
  validateUrl
};
