import NotificationStore from '../stores/notification-store.js';
import { groupNotifications } from '../utils/notification-utils.js';

class EventService {
  static dependencies = [NotificationStore];

  constructor(notificationStore) {
    this.notificationStore = notificationStore;
  }

  async getNotificationGroups({ user }) {
    const notifications = await this.notificationStore.getNotificationsByNotifiedUserId(user._id);
    return groupNotifications(notifications);
  }

  async deleteUserNotificationsByIds({ user, notificationIds }) {
    await this.notificationStore.deleteNotificationsByNotifiedUserIdAndNotificationIds(user._id, notificationIds);
  }

  async deleteUserNotifications({ user }) {
    await this.notificationStore.deleteNotificationsByNotifiedUserId(user._id);
  }
}

export default EventService;
