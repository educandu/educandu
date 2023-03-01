import moment from 'moment';
import NotificationStore from '../stores/notification-store.js';
import { groupNotifications } from '../utils/notification-utils.js';

const MAX_NOTIFICATION_LIFETIME_IN_MONTHS = 6;

class EventService {
  static dependencies = [NotificationStore];

  constructor(notificationStore) {
    this.notificationStore = notificationStore;
  }

  async getNotificationGroups({ user }) {
    const notifications = await this.notificationStore.getUnreadNotificationsByNotifiedUserId(user._id);
    return groupNotifications(notifications);
  }

  async pruneNotifications() {
    const createdBefore = moment().subtract(MAX_NOTIFICATION_LIFETIME_IN_MONTHS, 'months').toDate();
    await this.notificationStore.deleteNotificationsCreatedBefore(createdBefore);
  }
}

export default EventService;
