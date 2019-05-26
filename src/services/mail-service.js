const nodemailer = require('nodemailer');
const Logger = require('../common/logger');
const ServerSettings = require('../bootstrap/server-settings');

const logger = new Logger(__filename);

const ELMU_WEB_EMAIL_ADDRESS = 'website@elmu.online';

class MailService {
  static get inject() { return [ServerSettings]; }

  constructor(serverSettings) {
    this.transport = nodemailer.createTransport(serverSettings.smtpOptions);
  }

  sendRegistrationVerificationLink(emailAddress, verificationLink) {
    logger.info('Creating email with registration verification link %s', verificationLink);
    const message = {
      from: ELMU_WEB_EMAIL_ADDRESS,
      to: emailAddress,
      subject: 'Ihre Registrierung auf ELMU',
      text: `Verifizieren Sie sich hier: ${verificationLink}`,
      html: `<p>Verifizieren Sie sich <a href="${verificationLink}">hier</a></p>`
    };

    return this._sendMail(message);
  }

  sendPasswordResetRequestCompletionLink(emailAddress, completionLink) {
    logger.info('Creating email with password reset request completion link %s', completionLink);
    const message = {
      from: ELMU_WEB_EMAIL_ADDRESS,
      to: emailAddress,
      subject: 'Ihr Kennwort auf ELMU',
      text: `Ändern Sie hier Ihr Kennwort: ${completionLink}`,
      html: `<p>Ändern Sie <a href="${completionLink}">hier</a> Ihr Kennwort.</p>`
    };

    return this._sendMail(message);
  }

  _sendMail(message) {
    logger.info('Sending email with subject "%s"', message.subject);
    return this.transport.sendMail(message);
  }
}

module.exports = MailService;
