import express from 'express';
import PageRenderer from './page-renderer';
import Database from '../stores/database.js';
import permissions from '../domain/permissions';
import MailService from '../services/mail-service';
import ClientDataMapper from './client-data-mapper';
import SettingService from '../services/setting-service';
import ServerSettings from '../bootstrap/server-settings';
import needsPermission from '../domain/needs-permission-middleware';

const jsonParser = express.json();

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

export default SettingController;
