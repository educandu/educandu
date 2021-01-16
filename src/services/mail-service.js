import nodemailer from 'nodemailer';
import Logger from '../common/logger';
import ServerConfig from '../bootstrap/server-config';

const logger = new Logger(__filename);

const ELMU_WEB_EMAIL_ADDRESS = 'website@elmu.online';

class MailService {
  static get inject() { return [ServerConfig]; }

  constructor(serverConfig) {
    this.transport = nodemailer.createTransport(serverConfig.smtpOptions);
  }

  sendRegistrationVerificationLink(emailAddress, verificationLink) {
    logger.info('Creating email with registration verification link %s', verificationLink);
    const message = {
      from: ELMU_WEB_EMAIL_ADDRESS,
      to: emailAddress,
      subject: 'Willkommen auf ELMU! / Welcome to ELMU!',
      text: [
        `Willkommen! Sie haben sich erfolgreich auf ELMU registriert. Bitte bestätigen Sie Ihre Registrierung hier: ${verificationLink}`,
        `Welcome! You have registered successfully with ELMU. Please confirm your registration here: ${verificationLink}`
      ].join('\n\n'),
      html: [
        `<p>Willkommen! Sie haben sich erfolgreich auf ELMU registriert. Bitte bestätigen Sie Ihre Registrierung hier: <a href="${verificationLink}">Registrierung bestätigen</a></p>`,
        `<p>Welcome! You have registered successfully with ELMU. Please confirm your registration here: <a href="${verificationLink}">confirm registration</a></p>`
      ].join('\n')
    };

    return this._sendMail(message);
  }

  sendPasswordResetRequestCompletionLink(emailAddress, completionLink) {
    logger.info('Creating email with password reset request completion link %s', completionLink);
    const message = {
      from: ELMU_WEB_EMAIL_ADDRESS,
      to: emailAddress,
      subject: 'Ihr Kennwort auf ELMU / Your password for ELMU',
      text: [
        `Sie möchten Ihr Kennwort auf ELMU ändern? Zum Ändern Ihres Kennworts klicken Sie bitte hier: ${completionLink}`,
        `You want to change your password for ELMU? Please click here in order to change your password: ${completionLink}`
      ].join('\n\n'),
      html: [
        `<p>Sie möchten Ihr Kennwort auf ELMU ändern? Zum Ändern Ihres Kennworts klicken Sie bitte hier: <a href="${completionLink}">Kennwort ändern</a>.</p>`,
        `<p>You want to change your password for ELMU? Please click here in order to change your password: <a href="${completionLink}">change password</a>.</p>`
      ].join('\n')
    };

    return this._sendMail(message);
  }

  _sendMail(message) {
    logger.info('Sending email with subject "%s"', message.subject);
    return this.transport.sendMail(message);
  }
}

export default MailService;
