import express from 'express';
import permissions from '../domain/permissions.js';
import SettingService from '../services/setting-service.js';
import { validateBody } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { saveSettingsBodySchema } from '../domain/schemas/settings-schemas.js';

const jsonParser = express.json();

class SettingsController {
  static get inject() { return [SettingService]; }

  constructor(settingService) {
    this.settingService = settingService;
  }

  async handleGetSettings(_req, res) {
    const settings = await this.settingService.getAllSettings();
    return res.send({ settings });
  }

  async handlePostSettings(req, res) {
    const { settings } = req.body;
    await this.settingService.saveSettings(settings);
    return res.send({ settings });
  }

  registerMiddleware(router) {
    router.use(async (req, _res, next) => {
      try {
        req.settings = await this.settingService.getAllSettings();
        next();
      } catch (error) {
        next(error);
      }
    });
  }

  registerApi(app) {
    app.get(
      '/api/v1/settings',
      [needsPermission(permissions.MANAGE_SETTINGS)],
      (req, res) => this.handleGetSettings(req, res)
    );
    app.post(
      '/api/v1/settings',
      [needsPermission(permissions.MANAGE_SETTINGS), jsonParser, validateBody(saveSettingsBodySchema)],
      (req, res) => this.handlePostSettings(req, res)
    );
  }
}

export default SettingsController;
