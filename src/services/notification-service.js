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
}

export default EventService;
