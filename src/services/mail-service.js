import htmlescape from 'htmlescape';
import nodemailer from 'nodemailer';
import Logger from '../common/logger.js';
import ServerConfig from '../bootstrap/server-config.js';
import ResourceManager from '../resources/resource-manager.js';
import { SUPPORTED_UI_LANGUAGES } from '../resources/ui-language.js';

const logger = new Logger(import.meta.url);

class MailService {
  static get inject() { return [ServerConfig, ResourceManager]; }

  constructor(serverConfig, resourceManager) {
    this.resourceManager = resourceManager;
    this.emailSenderAddress = serverConfig.emailSenderAddress;
    this.transport = nodemailer.createTransport(serverConfig.smtpOptions);

    this.translators = SUPPORTED_UI_LANGUAGES.map(language => this.resourceManager.createI18n(language).t);
  }

  sendRegistrationVerificationEmail({ email, username, verificationLink }) {
    logger.info(`Creating email with registration verification link ${verificationLink}`);

    const subject = this.translators
      .map(t => t('mailService:registrationVerificationEmail.subject', { username, verificationLink }))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:registrationVerificationEmail.text', { username, verificationLink }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:registrationVerificationEmail.html', {
        username: htmlescape(username), verificationLink
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  sendPasswordResetEmail({ email, username, completionLink }) {
    logger.info(`Creating email with password reset request completion link ${completionLink}`);

    const subject = this.translators
      .map(t => t('mailService:passwordResetEmail.subject', { username, completionLink }))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:passwordResetEmail.text', { username, completionLink }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:passwordResetEmail.html', {
        username: htmlescape(username), completionLink
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  sendRoomInvitationEmail({ email, ownerName, roomName, invitationLink }) {
    logger.info(`Creating email with room invitation link ${invitationLink}`);

    const subject = this.translators
      .map(t => t('mailService:roomInvitationEmail.subject', { ownerName, roomName, invitationLink }))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:roomInvitationEmail.text', { ownerName, roomName, invitationLink }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:roomInvitationEmail.html', {
        ownerName: htmlescape(ownerName), roomName: htmlescape(roomName), invitationLink
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  sendRoomDeletionNotificationEmail({ email, ownerName, roomName }) {
    logger.info(`Sending delete notification to ${email}`);

    const subject = this.translators
      .map(t => t('mailService:roomDeletionNotificationEmail.subject', { ownerName, roomName }))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:roomDeletionNotificationEmail.text', { ownerName, roomName }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:roomDeletionNotificationEmail.html', {
        ownerName: htmlescape(ownerName), roomName: htmlescape(roomName)
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  _sanitizeText(translation) {
    return translation.replaceAll('\\n', '\n');
  }

  _sendMail(message) {
    message.subject = this._sanitizeText(message.subject);
    message.text = this._sanitizeText(message.text);

    logger.info(`Sending email with subject "${message.subject}"`);
    return this.transport.sendMail(message);
  }
}

export default MailService;
