import moment from 'moment';
import Logger from '../common/logger.js';
import UserStore from '../stores/user-store.js';
import NotificationStore from '../stores/notification-store.js';
import { groupNotifications } from '../utils/notification-utils.js';
import {
  EMAIL_NOTIFICATION_FREQUENCY,
  EMAIL_NOTIFICATION_DUE_DAY_OF_MONTH,
  EMAIL_NOTIFICATION_DUE_DAY_OF_WEEK
} from '../domain/constants.js';

const logger = new Logger(import.meta.url);

class EventService {
  static dependencies = [NotificationStore, UserStore];

  constructor(notificationStore, userStore) {
    this.notificationStore = notificationStore;
    this.userStore = userStore;
  }

  async getNotificationGroups({ user }) {
    const notifications = await this.notificationStore.getNotificationsByNotifiedUserId(user._id);
    return groupNotifications(notifications);
  }

  async deleteUserNotificationsByIds({ user, notificationIds }) {
    await this.notificationStore.deleteNotificationsByNotifiedUserIdAndNotificationIds(user._id, notificationIds);
  }

  async createEmailNotifications(context) {
    const now = moment();
    const isDueDayOfWeek = now.isoWeekday() === EMAIL_NOTIFICATION_DUE_DAY_OF_WEEK;
    const isDueDayOfMonth = now.date() === EMAIL_NOTIFICATION_DUE_DAY_OF_MONTH;

    const userIterator = await this.userStore.getActiveUsersIterator();

    try {
      const emailNotifications = [];
      for await (const user of userIterator) {
        if (context.cancellationRequested) {
          logger.info('Sending notification emails has been cancelled');
          return [];
        }

        const isDueDayForUser = user.emailNotificationFrequency === EMAIL_NOTIFICATION_FREQUENCY.daily
          || (isDueDayOfWeek && user.emailNotificationFrequency === EMAIL_NOTIFICATION_FREQUENCY.weekly)
          || (isDueDayOfMonth && user.emailNotificationFrequency === EMAIL_NOTIFICATION_FREQUENCY.monthly);

        if (isDueDayForUser) {
          const notifications = await this.notificationStore.getNotificationsByNotifiedUserId(user._id);

          if (notifications) {
            const groupedNotifications = groupNotifications(notifications);
            emailNotifications.push({ user, notificationsCount: groupedNotifications.length });
          }
        }
      }

      return emailNotifications;
    } finally {
      await userIterator.close();
    }
  }
}

export default EventService;
