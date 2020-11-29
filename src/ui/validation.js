function validateUrl(url, { allowInsecure = false } = {}) {
  let validateStatus;
  let help;

  if (url === '') {
    validateStatus = 'warning';
    help = 'Bitte geben Sie eine Adresse an.';
  } else if (!(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/).test(url)) {
    validateStatus = 'error';
    help = 'Bitte geben Sie eine Adresse im gültigen Format an.';
  } else if (!allowInsecure && !url.startsWith('https:')) {
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
