import htmlescape from 'htmlescape';
import nodemailer from 'nodemailer';
import Logger from '../common/logger.js';
import UserStore from '../stores/user-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import ResourceManager from '../resources/resource-manager.js';
import { SUPPORTED_UI_LANGUAGES } from '../resources/ui-language.js';
import {
  PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS,
  PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS,
  PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS
} from '../domain/constants.js';

const logger = new Logger(import.meta.url);

class MailService {
  static get inject() { return [ServerConfig, UserStore, ResourceManager]; }

  constructor(serverConfig, userStore, resourceManager) {
    this.userStore = userStore;
    this.resourceManager = resourceManager;
    this.emailSenderAddress = serverConfig.emailSenderAddress;
    this.transport = nodemailer.createTransport(serverConfig.smtpOptions);

    this.translators = SUPPORTED_UI_LANGUAGES.map(language => this.resourceManager.createI18n(language).t);
  }

  sendRegistrationVerificationEmail({ email, username, verificationLink }) {
    logger.info(`Creating email with registration verification link ${verificationLink}`);

    const subject = this.translators
      .map(t => t('mailService:registrationVerificationEmail.subject'))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:registrationVerificationEmail.text', {
        username,
        verificationLink,
        hours: PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS
      }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:registrationVerificationEmail.html', {
        username: htmlescape(username),
        verificationLink,
        hours: PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  sendPasswordResetEmail({ email, username, completionLink }) {
    logger.info(`Creating email with password reset request completion link ${completionLink}`);

    const subject = this.translators
      .map(t => t('mailService:passwordResetEmail.subject'))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:passwordResetEmail.text', {
        username,
        completionLink,
        hours: PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS
      }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:passwordResetEmail.html', {
        username: htmlescape(username),
        completionLink,
        hours: PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  sendRoomInvitationEmail({ email, ownerName, roomName, invitationLink }) {
    logger.info(`Creating email with room invitation link ${invitationLink}`);

    const subject = this.translators
      .map(t => t('mailService:roomInvitationEmail.subject'))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:roomInvitationEmail.text', {
        ownerName,
        roomName,
        invitationLink,
        days: PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS
      }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:roomInvitationEmail.html', {
        ownerName: htmlescape(ownerName),
        roomName: htmlescape(roomName),
        invitationLink,
        days: PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  async sendRoomDeletionNotificationEmails({ roomName, ownerName, roomMembers }) {
    const userIds = roomMembers.map(({ userId }) => userId);
    const users = await this.userStore.getUsersByIds(userIds);

    await Promise.all(users.map(({ email }) => {
      return this._sendRoomDeletionNotificationEmail({ email, roomName, ownerName });
    }));
  }

  _sendRoomDeletionNotificationEmail({ email, ownerName, roomName }) {
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

  _sendMail(message) {
    logger.info(`Sending email with subject "${message.subject}"`);
    return this.transport.sendMail(message);
  }
}

export default MailService;
