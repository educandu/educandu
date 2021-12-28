import express from 'express';
import Database from '../stores/database.js';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import MailService from '../services/mail-service.js';
import ClientDataMapper from './client-data-mapper.js';
import SettingService from '../services/setting-service.js';
import DocumentService from '../services/document-service.js';
import { validateBody } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { saveSettingsBodySchema } from '../domain/schemas/settings-schemas.js';

const jsonParser = express.json();

class SettingController {
  static get inject() { return [Database, SettingService, DocumentService, MailService, ClientDataMapper, PageRenderer]; }

  constructor(database, settingService, documentService, mailService, clientDataMapper, pageRenderer) {
    this.database = database;
    this.settingService = settingService;
    this.documentService = documentService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  async handleGetAllSettings(req, res, next) {
    req.settings = await this.settingService.getAllSettings();
    next();
  }

  async handleGetSettingsPage(req, res) {
    const [settings, docs] = await Promise.all([
      this.settingService.getAllSettings(),
      this.documentService.getAllDocumentsMetadata()
    ]);
    const documents = await this.clientDataMapper.mapDocsOrRevisions(docs, req.user);
    const initialState = { settings, documents };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.settings, initialState);
  }

  async handlePostSettings(req, res) {
    const { settings } = req.body;
    await this.settingService.saveSettings(settings);
    return res.send({ settings });
  }

  registerMiddleware(router) {
    router.use((req, res, next) => this.handleGetAllSettings(req, res, next));
  }

  registerPages(app) {
    app.get(
      '/settings',
      needsPermission(permissions.EDIT_SETTINGS),
      (req, res) => this.handleGetSettingsPage(req, res)
    );
  }

  registerApi(app) {
    app.post(
      '/api/v1/settings',
      [needsPermission(permissions.EDIT_SETTINGS), jsonParser, validateBody(saveSettingsBodySchema)],
      (req, res) => this.handlePostSettings(req, res)
    );
  }
}

export default SettingController;
