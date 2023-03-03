import Database from './database.js';
import { validate } from '../domain/validation.js';
import { notificationDbSchema } from '../domain/schemas/notification-schemas.js';

class NotificationStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.notifications;
  }

  getNotificationsByNotifiedUserId(notifiedUserId, { session } = {}) {
    return this.collection
      .find({ notifiedUserId }, { session })
      .sort({ createdOn: 1 })
      .limit(1000)
      .toArray();
  }

  async insertNotifications(notifications, { session } = {}) {
    notifications.forEach(notification => validate(notification, notificationDbSchema));
    await this.collection.insertMany(notifications, { session });
    return notifications;
  }

  async deleteNotificationsByNotifiedUserIdAndNotificationIds(notifiedUserId, notificationIds, { session } = {}) {
    await this.collection.deleteMany({ _id: { $in: notificationIds }, notifiedUserId }, { session });
  }
}

export default NotificationStore;
