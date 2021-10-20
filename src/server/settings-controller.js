import express from 'express';
import PageRenderer from './page-renderer';
import Database from '../stores/database.js';
import permissions from '../domain/permissions';
import MailService from '../services/mail-service';
import ClientDataMapper from './client-data-mapper';
import ServerConfig from '../bootstrap/server-config';
import SettingService from '../services/setting-service';
import DocumentService from '../services/document-service';
import { validateBody } from '../domain/validation-middleware';
import needsPermission from '../domain/needs-permission-middleware';
import { saveSettingsBodySchema } from '../domain/schemas/settings-schemas';

const jsonParser = express.json();

class SettingController {
  static get inject() { return [ServerConfig, Database, SettingService, DocumentService, MailService, ClientDataMapper, PageRenderer]; }

  constructor(serverConfig, database, settingService, documentService, mailService, clientDataMapper, pageRenderer) {
    this.serverConfig = serverConfig;
    this.database = database;
    this.settingService = settingService;
    this.documentService = documentService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerMiddleware(router) {
    router.use(async (req, _res, next) => {
      req.settings = await this.settingService.getAllSettings();
      next();
    });
  }

  registerPages(app) {
    app.get('/settings', needsPermission(permissions.EDIT_SETTINGS), async (req, res) => {
      const [settings, docs] = await Promise.all([
        this.settingService.getAllSettings(),
        this.documentService.getAllDocumentsMetadata()
      ]);
      const documents = await this.clientDataMapper.mapDocsOrRevisions(docs, req.user);
      const initialState = { settings, documents };
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'settings', initialState);
    });
  }

  registerApi(app) {
    app.post('/api/v1/settings', [needsPermission(permissions.EDIT_SETTINGS), jsonParser, validateBody(saveSettingsBodySchema)], async (req, res) => {
      const { settings } = req.body;
      await this.settingService.saveSettings(settings);
      return res.send({ settings });
    });
  }
}

export default SettingController;
