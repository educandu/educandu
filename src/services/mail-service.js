import nodemailer from 'nodemailer';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import UserStore from '../stores/user-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import { escapeMarkdown } from '../utils/string-utils.js';
import ResourceManager from '../resources/resource-manager.js';
import { SUPPORTED_UI_LANGUAGES } from '../resources/ui-language.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';
import {
  PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS,
  PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES,
  PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_MINUTES
} from '../domain/constants.js';

const logger = new Logger(import.meta.url);

const SUBJECT_LANGUAGE_SEPARATOR = ' / ';
const TEXT_LANGUAGE_SEPARATOR = '\n\n';
const MARKDOWN_LANGUAGE_SEPARATOR = '\n---\n';

class MailService {
  static dependencies = [GithubFlavoredMarkdown, ServerConfig, UserStore, ResourceManager];

  constructor(gfm, serverConfig, userStore, resourceManager) {
    this.gfm = gfm;
    this.serverConfig = serverConfig;
    this.userStore = userStore;
    this.resourceManager = resourceManager;
    this.transport = nodemailer.createTransport(serverConfig.smtpOptions);

    this.translators = SUPPORTED_UI_LANGUAGES.map(language => this.resourceManager.createI18n(language).t);
  }

  sendRegistrationVerificationEmail({ email, displayName, verificationCode }) {
    logger.info(`Creating email with registration verification code ${verificationCode}`);

    const subject = this.translators
      .map(t => t('mailService:registrationVerificationEmail.subject', { appName: this.serverConfig.appName }))
      .join(SUBJECT_LANGUAGE_SEPARATOR);

    const text = this.translators
      .map(t => t('mailService:registrationVerificationEmail.text', {
        appName: this.serverConfig.appName,
        displayName,
        verificationCode,
        minutes: PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES
      }))
      .join(TEXT_LANGUAGE_SEPARATOR);

    const html = this.gfm.render(this.translators
      .map(t => t('mailService:registrationVerificationEmail.markdown', {
        appName: escapeMarkdown(this.serverConfig.appName),
        displayName: escapeMarkdown(displayName),
        verificationCode: escapeMarkdown(verificationCode),
        minutes: PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES
      }))
      .join(MARKDOWN_LANGUAGE_SEPARATOR));

    const message = { from: this.serverConfig.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  sendPasswordResetEmail({ email, displayName, verificationCode }) {
    logger.info(`Creating email with password reset request verification code ${verificationCode}`);

    const subject = this.translators
      .map(t => t('mailService:passwordResetEmail.subject', { appName: this.serverConfig.appName }))
      .join(SUBJECT_LANGUAGE_SEPARATOR);

    const text = this.translators
      .map(t => t('mailService:passwordResetEmail.text', {
        appName: this.serverConfig.appName,
        displayName,
        verificationCode,
        minutes: PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_MINUTES
      }))
      .join(TEXT_LANGUAGE_SEPARATOR);

    const html = this.gfm.render(this.translators
      .map(t => t('mailService:passwordResetEmail.markdown', {
        appName: escapeMarkdown(this.serverConfig.appName),
        displayName: escapeMarkdown(displayName),
        verificationCode,
        minutes: PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_MINUTES
      }))
      .join(MARKDOWN_LANGUAGE_SEPARATOR));

    const message = { from: this.serverConfig.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  async sendRoomInvitationEmails({ invitations, ownerName, roomName }) {
    const origin = this.serverConfig.appRootUrl;

    await Promise.all(invitations.map(({ email, token }) => {
      const invitationLink = new URL(routes.getRoomMembershipConfirmationUrl(token), origin).href;
      return this._sendRoomInvitationEmail({ ownerName, roomName, email, invitationLink });
    }));
  }

  async sendRoomDeletionNotificationEmails({ roomName, ownerName, roomMembers }) {
    const userIds = roomMembers.map(({ userId }) => userId);
    const users = await this.userStore.getUsersByIds(userIds);

    await Promise.all(users.map(({ email }) => {
      return this._sendRoomDeletionNotificationEmail({ email, roomName, ownerName });
    }));
  }

  sendNotificationReminderEmail({ user, notificationsCount }) {
    logger.info(`Sending user notifications reminder to ${user.email}`);

    const appName = this.serverConfig.appName;
    const origin = this.serverConfig.appRootUrl;
    const notificationsLink = new URL(routes.getDashboardUrl({ tab: 'notifications' }), origin).href;
    const settingsLink = new URL(routes.getDashboardUrl({ tab: 'settings' }), origin).href;

    const subject = this.translators
      .map(t => t('mailService:userNotificationEmail.subject', { appName }))
      .join(SUBJECT_LANGUAGE_SEPARATOR);

    const text = this.translators
      .map(t => t('mailService:userNotificationEmail.text', {
        appName,
        userDisplayName: user.displayName,
        notificationsCount,
        notificationsLink,
        settingsLink
      }))
      .join(TEXT_LANGUAGE_SEPARATOR);

    const html = this.gfm.render(this.translators
      .map(t => t('mailService:userNotificationEmail.markdown', {
        appName: escapeMarkdown(appName),
        userDisplayName: escapeMarkdown(user.displayName),
        notificationsCount: escapeMarkdown(notificationsCount),
        notificationsLink: escapeMarkdown(notificationsLink),
        settingsLink: escapeMarkdown(settingsLink)
      }))
      .join(MARKDOWN_LANGUAGE_SEPARATOR));

    const message = { from: this.serverConfig.emailSenderAddress, to: user.email, subject, text, html };
    return this._sendMail(message);
  }

  sendRoomMemberRemovalNotificationEmail({ roomName, ownerName, memberUser }) {
    logger.info(`Sending room member removal notification to ${memberUser.email}`);

    const subject = this.translators
      .map(t => t('mailService:roomMemberRemovalNotificationEmail.subject', { ownerName, roomName }))
      .join(SUBJECT_LANGUAGE_SEPARATOR);

    const text = this.translators
      .map(t => t('mailService:roomMemberRemovalNotificationEmail.text', { displayName: memberUser.displayName, ownerName, roomName }))
      .join(TEXT_LANGUAGE_SEPARATOR);

    const html = this.gfm.render(this.translators
      .map(t => t('mailService:roomMemberRemovalNotificationEmail.markdown', {
        displayName: escapeMarkdown(memberUser.displayName),
        ownerName: escapeMarkdown(ownerName),
        roomName: escapeMarkdown(roomName)
      }))
      .join(MARKDOWN_LANGUAGE_SEPARATOR));

    const message = { from: this.serverConfig.emailSenderAddress, to: memberUser.email, subject, text, html };
    return this._sendMail(message);
  }

  sendRoomInvitationDeletionNotificationEmail({ roomName, ownerName, email }) {
    logger.info(`Sending room invitation deletion notification to ${email}`);

    const subject = this.translators
      .map(t => t('mailService:roomInvitationDeletionNotificationEmail.subject', { ownerName, roomName }))
      .join(SUBJECT_LANGUAGE_SEPARATOR);

    const text = this.translators
      .map(t => t('mailService:roomInvitationDeletionNotificationEmail.text', { ownerName, roomName }))
      .join(TEXT_LANGUAGE_SEPARATOR);

    const html = this.gfm.render(this.translators
      .map(t => t('mailService:roomInvitationDeletionNotificationEmail.markdown', {
        ownerName: escapeMarkdown(ownerName),
        roomName: escapeMarkdown(roomName)
      }))
      .join(MARKDOWN_LANGUAGE_SEPARATOR));

    const message = { from: this.serverConfig.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  _sendRoomInvitationEmail({ ownerName, roomName, email, invitationLink }) {
    logger.info(`Creating email with room invitation link ${invitationLink}`);

    const subject = this.translators
      .map(t => t('mailService:roomInvitationEmail.subject'))
      .join(SUBJECT_LANGUAGE_SEPARATOR);

    const text = this.translators
      .map(t => t('mailService:roomInvitationEmail.text', {
        ownerName,
        roomName,
        invitationLink,
        days: PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS
      }))
      .join(TEXT_LANGUAGE_SEPARATOR);

    const html = this.gfm.render(this.translators
      .map(t => t('mailService:roomInvitationEmail.markdown', {
        ownerName: escapeMarkdown(ownerName),
        roomName: escapeMarkdown(roomName),
        invitationLink,
        days: PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS
      }))
      .join(MARKDOWN_LANGUAGE_SEPARATOR));

    const message = { from: this.serverConfig.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  _sendRoomDeletionNotificationEmail({ email, ownerName, roomName }) {
    logger.info(`Sending delete notification to ${email}`);

    const subject = this.translators
      .map(t => t('mailService:roomDeletionNotificationEmail.subject', { ownerName, roomName }))
      .join(SUBJECT_LANGUAGE_SEPARATOR);

    const text = this.translators
      .map(t => t('mailService:roomDeletionNotificationEmail.text', { ownerName, roomName }))
      .join(TEXT_LANGUAGE_SEPARATOR);

    const html = this.gfm.render(this.translators
      .map(t => t('mailService:roomDeletionNotificationEmail.markdown', {
        ownerName: escapeMarkdown(ownerName),
        roomName: escapeMarkdown(roomName)
      }))
      .join(MARKDOWN_LANGUAGE_SEPARATOR));

    const message = { from: this.serverConfig.emailSenderAddress, to: email, subject, text, html };
    return this._sendMail(message);
  }

  _sendMail(message) {
    logger.info(`Sending email with subject "${message.subject}"`);
    return this.transport.sendMail(message);
  }
}

export default MailService;
