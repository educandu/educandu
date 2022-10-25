import routes from '../utils/routes.js';
import { Container } from '../common/di.js';
import AmbController from './amb-controller.js';
import RoomController from './room-controller.js';
import I18nController from './i18n-controller.js';
import UserController from './user-controller.js';
import IndexController from './index-controller.js';
import ErrorController from './error-controller.js';
import AdminController from './admin-controller.js';
import BatchController from './batch-controller.js';
import SearchController from './search-controller.js';
import StaticController from './static-controller.js';
import StorageController from './storage-controller.js';
import CommentController from './comment-controller.js';
import SettingsController from './settings-controller.js';
import DocumentController from './document-controller.js';
import RevisionController from './revision-controller.js';
import PdfJsApiController from './pdfjs-api-controller.js';
import DashboardController from './dashboard-controller.js';
import UserAgentController from './user-agent-controller.js';

const controllerTypes = [
  StaticController,
  I18nController,
  UserAgentController,
  SettingsController,
  IndexController,
  SearchController,
  UserController,
  DocumentController,
  StorageController,
  BatchController,
  ErrorController,
  RoomController,
  DashboardController,
  RevisionController,
  PdfJsApiController,
  AdminController,
  AmbController,
  CommentController
];

class ControllerFactory {
  static get inject() { return [Container]; }

  constructor(container) {
    this.container = container;
  }

  registerAdditionalControllers(additionalControllers) {
    controllerTypes.push(...additionalControllers);
  }

  registerPermanentRedirects(router) {
    router.get('/lessons/:id', (req, res) => res.redirect(301, routes.getDocUrl({ id: req.params.id })));
    router.get('/revs/articles/:id', (req, res) => res.redirect(301, routes.getDocumentRevisionUrl(req.params.id)));
  }

  getAllControllers() {
    return controllerTypes.map(ControllerType => this.container.get(ControllerType));
  }
}

export default ControllerFactory;
