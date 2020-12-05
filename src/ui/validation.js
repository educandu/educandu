// Copied from: https://urlregex.com/
// eslint-disable-next-line max-len
const URL_REGEX = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;

const URL_SECURE_PROTO_REGEX = /^https:\/\/.+$/;

function validateUrl(url, { allowInsecure = false } = {}) {
  let validateStatus;
  let help;

  if (!url) {
    validateStatus = 'warning';
    help = 'Bitte geben Sie eine Adresse an.';
  } else if (!URL_REGEX.test(url)) {
    validateStatus = 'error';
    help = 'Bitte geben Sie eine Adresse im gültigen Format an.';
  } else if (!allowInsecure && !URL_SECURE_PROTO_REGEX.test(url)) {
    validateStatus = 'error';
    help = 'Bitte geben Sie eine Adresse mit sicherem Protokoll (https) an.';
  } else {
    validateStatus = 'success';
    help = null;
  }

  return { validateStatus, help };
}

module.exports = {
  validateUrl
};
