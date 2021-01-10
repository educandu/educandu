import SettingService from '../services/setting-service';

class SettingsController {
  static get inject() { return [SettingService]; }

  constructor(settingService) {
    this.settingService = settingService;
  }

  registerMiddleware(router) {
    router.use(async (req, res, next) => {
      req.settings = await this.settingService.getAllSettings();
      next();
    });
  }
}

export default SettingsController;
