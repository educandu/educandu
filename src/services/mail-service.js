import nodemailer from 'nodemailer';
import Logger from '../common/logger.js';
import ServerConfig from '../bootstrap/server-config.js';

const logger = new Logger(import.meta.url);
class MailService {
  static get inject() { return [ServerConfig]; }

  constructor(serverConfig) {
    this.emailSenderAddress = serverConfig.emailSenderAddress;
    this.transport = nodemailer.createTransport(serverConfig.smtpOptions);
  }

  sendRegistrationVerificationLink({ username, email, verificationLink }) {
    logger.info('Creating email with registration verification link %s', verificationLink);

    const germanText
      = 'Willkommen!\n\n'
      + `Sie haben sich erfolgreich als ${username} auf ELMU registriert.\n`
      + `Bitte bestätigen Sie Ihre Registrierung hier: ${verificationLink}`;

    const germanHtml
      = '<p>Willkommen!<br/><br/>'
      + `Sie haben sich erfolgreich als ${username} auf ELMU registriert.<br/>`
      + `Bitte bestätigen Sie Ihre Registrierung hier: <a href="${verificationLink}">Registrierung bestätigen</a></p>`;

    const englishText
      = 'Welcome!\n\n'
      + `You have registered successfully with ELMU as ${username}.\n`
      + `Please confirm your registration here: ${verificationLink}`;

    const englishHtml
      = '<p>Welcome!<br/><br/>'
      + `You have registered successfully with ELMU as ${username}.<br/>`
      + `Please confirm your registration here: <a href="${verificationLink}">confirm registration</a></p>`;

    const message = {
      from: this.emailSenderAddress,
      to: email,
      subject: 'Willkommen auf ELMU! / Welcome to ELMU!',
      text: `${germanText}\n\n${englishText}`,
      html: `${germanHtml}\n${englishHtml}`
    };

    return this._sendMail(message);
  }

  sendPasswordResetRequestCompletionLink({ username, email, completionLink }) {
    logger.info('Creating email with password reset request completion link %s', completionLink);

    const germanText
      = `Hallo ${username}!\n\n`
      + 'Sie möchten Ihr Kennwort auf ELMU ändern?\n'
      + `Zum Ändern Ihres Kennworts klicken Sie bitte hier: ${completionLink}`;

    const germanHtml
      = `<p>Hallo ${username}!<br/><br/>`
      + 'Sie möchten Ihr Kennwort auf ELMU ändern?<br/>'
      + `Zum Ändern Ihres Kennworts klicken Sie bitte hier: <a href="${completionLink}">Kennwort ändern</a>.</p>`;

    const englishText
      = `Hello ${username}!\n\n`
      + 'You want to change your password for ELMU?\n'
      + `Please click here in order to change your password: ${completionLink}`;

    const englishHtml
      = `<p>Hello ${username}!<br/><br/>`
      + 'You want to change your password for ELMU?<br/>'
      + `Please click here in order to change your password: <a href="${completionLink}">change password</a>.</p>`;

    const message = {
      from: this.emailSenderAddress,
      to: email,
      subject: 'Ihr Kennwort auf ELMU/ Your password for ELMU',
      text: `${germanText}\n\n${englishText}`,
      html: `${germanHtml}\n${englishHtml}`
    };

    return this._sendMail(message);
  }

  _sendMail(message) {
    logger.info('Sending email with subject "%s"', message.subject);
    return this.transport.sendMail(message);
  }
}

export default MailService;
