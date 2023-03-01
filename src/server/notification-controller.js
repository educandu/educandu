import NotificationService from '../services/notification-service.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class NotificationController {
  static dependencies = [NotificationService, ClientDataMappingService];

  constructor(notificationService, clientDataMappingService) {
    this.notificationService = notificationService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetNotificationGroups(req, res) {
    const { user } = req;
    const notificationGroups = await this.notificationService.getNotificationGroups({ user });
    const mappedNotificationGroups = await this.clientDataMappingService.mapUserNotificationGroups(notificationGroups, user);
    return res.send({ notificationGroups: mappedNotificationGroups });
  }

  async handleBeforePages(req, _res, next) {
    let unreadNotificationsCount;
    try {
      const { user } = req;
      if (user) {
        const notificationGroups = await this.notificationService.getNotificationGroups({ user });
        unreadNotificationsCount = notificationGroups.length;
      } else {
        unreadNotificationsCount = 0;
      }
    } catch (error) {
      unreadNotificationsCount = 0;
    }

    // eslint-disable-next-line require-atomic-updates
    req.unreadNotificationsCount = unreadNotificationsCount;

    next();
  }

  registerApi(router) {
    router.get(
      '/api/v1/notifications/groups',
      needsAuthentication(),
      (req, res) => this.handleGetNotificationGroups(req, res)
    );
  }

  registerBeforePages(router) {
    router.use((req, res, next) => this.handleBeforePages(req, res, next));
  }
}

export default NotificationController;
