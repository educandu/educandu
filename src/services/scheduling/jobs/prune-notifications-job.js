import NotificationService from '../../notification-service.js';

const EVERY_DAY_AT_1_AM_CRON_EXPRESSION = '0 0 1 * * *';

export default class LoadSamlMetadataJob {
  static dependencies = [NotificationService];

  constructor(notificationService) {
    this.preventOverrun = true;
    this.name = 'prune-notifications';
    this.notificationService = notificationService;
    this.cronExpression = EVERY_DAY_AT_1_AM_CRON_EXPRESSION;
  }

  process() {
    return this.notificationService.pruneNotifications();
  }
}
