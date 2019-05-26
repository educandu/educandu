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
      subject: 'Willkommen auf elmu!',
      text: `Willkommen! Sie haben sich erfolgreich auf elmu registriert. Bitte bestätigen Sie Ihre Registrierung hier: ${verificationLink}`,
      html: `<p>Willkommen! Sie haben sich erfolgreich auf elmu registriert. Bitte bestätigen Sie Ihre Registrierung hier: <a href="${verificationLink}">Registrierung bestätigen</a></p>`
    };

    return this._sendMail(message);
  }

  sendPasswordResetRequestCompletionLink(emailAddress, completionLink) {
    logger.info('Creating email with password reset request completion link %s', completionLink);
    const message = {
      from: ELMU_WEB_EMAIL_ADDRESS,
      to: emailAddress,
      subject: 'Ihr Kennwort auf ELMU',
      text: `Sie möchten Ihr Kennwort auf elmu ändern? Zum Ändern Ihres Kennworts klicken Sie bitte hier: ${completionLink}`,
      html: `<p>Sie möchten Ihr Kennwort auf elmu ändern? Zum Ändern Ihres Kennworts klicken Sie bitte hier: <a href="${completionLink}">Kennwort ändern</a>.</p>`
    };

    return this._sendMail(message);
  }

  _sendMail(message) {
    logger.info('Sending email with subject "%s"', message.subject);
    return this.transport.sendMail(message);
  }
}

module.exports = MailService;
