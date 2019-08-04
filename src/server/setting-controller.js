const bodyParser = require('body-parser');
const PageRenderer = require('./page-renderer');
const Database = require('../stores/database.js');
const permissions = require('../domain/permissions');
const SettingService = require('../services/setting-service');
const MailService = require('../services/mail-service');
const ClientDataMapper = require('./client-data-mapper');
const ServerSettings = require('../bootstrap/server-settings');
const needsPermission = require('../domain/needs-permission-middleware');

const jsonParser = bodyParser.json();

class SettingController {
  static get inject() { return [ServerSettings, Database, SettingService, MailService, ClientDataMapper, PageRenderer]; }

  constructor(serverSettings, database, settingService, mailService, clientDataMapper, pageRenderer) {
    this.serverSettings = serverSettings;
    this.database = database;
    this.settingService = settingService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerPages(app) {
    app.get('/settings', needsPermission(permissions.EDIT_SETTINGS), async (req, res) => {
      const initialState = await this.settingService.getAllSettings();
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'settings', initialState);
    });
  }

  registerApi(app) {
    app.post('/api/v1/settings', [needsPermission(permissions.EDIT_SETTINGS), jsonParser], async (req, res) => {
      const { settings } = req.body;
      await this.settingService.saveSettings(settings);
      return res.send({ settings });
    });
  }
}

module.exports = SettingController;
