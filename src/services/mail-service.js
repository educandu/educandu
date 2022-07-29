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

  sendRegistrationVerificationEmail({ email, displayName, verificationLink }) {
    logger.info(`Creating email with registration verification link ${verificationLink}`);

    const subject = this.translators
      .map(t => t('mailService:registrationVerificationEmail.subject'))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:registrationVerificationEmail.text', {
        displayName,
        verificationLink,
        hours: PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS
      }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:registrationVerificationEmail.html', {
        displayName: htmlescape(displayName),
        verificationLink,
        hours: PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  sendPasswordResetEmail({ email, displayName, completionLink }) {
    logger.info(`Creating email with password reset request completion link ${completionLink}`);

    const subject = this.translators
      .map(t => t('mailService:passwordResetEmail.subject'))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:passwordResetEmail.text', {
        displayName,
        completionLink,
        hours: PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS
      }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:passwordResetEmail.html', {
        displayName: htmlescape(displayName),
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

  sendRoomMemberRemovalNotificationEmail({ roomName, ownerName, memberUser }) {
    logger.info(`Sending room member removal notification to ${memberUser.email}`);

    const subject = this.translators
      .map(t => t('mailService:roomMemberRemovalNotificationEmail.subject', { ownerName, roomName }))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:roomMemberRemovalNotificationEmail.text', { displayName: memberUser.displayName, ownerName, roomName }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:roomMemberRemovalNotificationEmail.html', {
        displayName: htmlescape(memberUser.displayName), ownerName: htmlescape(ownerName), roomName: htmlescape(roomName)
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: memberUser.email, subject, text, html };
    return this._sendMail(message);
  }

  sendRoomInvitationDeletionNotificationEmail({ roomName, ownerName, email }) {
    logger.info(`Sending room invitation deletion notification to ${email}`);

    const subject = this.translators
      .map(t => t('mailService:roomInvitationDeletionNotificationEmail.subject', { ownerName, roomName }))
      .join(' / ');

    const text = this.translators
      .map(t => t('mailService:roomInvitationDeletionNotificationEmail.text', { ownerName, roomName }))
      .join('\n\n');

    const html = this.translators
      .map(t => t('mailService:roomInvitationDeletionNotificationEmail.html', {
        ownerName: htmlescape(ownerName), roomName: htmlescape(roomName)
      }))
      .join('\n');

    const message = { from: this.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
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
