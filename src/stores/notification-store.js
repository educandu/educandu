import Database from './database.js';
import { validate } from '../domain/validation.js';
import { notificationDbSchema } from '../domain/schemas/notification-schemas.js';

class NotificationStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.notifications;
  }

  getUnreadNotificationsByNotifiedUserId(notifiedUserId, { session } = {}) {
    return this.collection
      .find({ notifiedUserId, readOn: null }, { session })
      .sort({ createdOn: -1 })
      .limit(1000)
      .toArray();
  }

  async insertNotifications(notifications, { session } = {}) {
    notifications.forEach(notification => validate(notification, notificationDbSchema));
    await this.collection.insertMany(notifications, { session });
    return notifications;
  }

  async setNotificationsReadOnByUserIdAndNotificationIds(notifiedUserId, notificationIds, readOn, { session } = {}) {
    await this.collection.updateMany({ _id: { $in: notificationIds }, notifiedUserId }, { readOn }, { session });
  }

  async deleteNotificationsCreatedBefore(createdBefore, { session } = {}) {
    const result = await this.collection.deleteMany({ createdOn: { $lt: createdBefore } }, { session });
    return result.value;
  }
}

export default NotificationStore;
