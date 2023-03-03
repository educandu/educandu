import Logger from '../../../common/logger.js';
import MailService from '../../mail-service.js';
import NotificationService from '../../notification-service.js';
import { EMAIL_NOTIFICATION_SENDER_CRON_PATTERN } from '../../../domain/constants.js';

const logger = new Logger(import.meta.url);

export default class SendNotificationEmailsJob {
  static dependencies = [NotificationService, MailService];

  constructor(notificationService, mailService) {
    this.notificationService = notificationService;
    this.mailService = mailService;
    this.name = 'send-notification-emails';
    this.cronExpression = EMAIL_NOTIFICATION_SENDER_CRON_PATTERN;
    this.preventOverrun = true;
  }

  async process(context) {
    let emailNotifications;

    try {
      emailNotifications = await this.notificationService.createEmailNotifications(context);
    } catch (error) {
      logger.error(error);
      return;
    }

    for (const emailNotification of emailNotifications) {
      if (context.cancellationRequested) {
        logger.info('Sending notification emails has been cancelled');
        return;
      }

      try {
        await this.mailService.sendNotificationReminderEmail(emailNotification);
      } catch (error) {
        logger.error(error);
      }
    }
  }
}
