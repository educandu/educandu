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
import CommentController from './comment-controller.js';
import SettingsController from './settings-controller.js';
import DocumentController from './document-controller.js';
import RevisionController from './revision-controller.js';
import PdfJsApiController from './pdfjs-api-controller.js';
import DashboardController from './dashboard-controller.js';
import RedactionController from './redaction-controller.js';
import UserAgentController from './user-agent-controller.js';
import StoragePlanController from './storage-plan-controller.js';
import NotificationController from './notification-controller.js';
import MediaLibraryController from './media-library-controller.js';

const setupControllers = [
  StaticController,
  I18nController,
  UserAgentController,
  SettingsController
];

const pageAndApiControllers = [
  IndexController,
  SearchController,
  UserController,
  DocumentController,
  MediaLibraryController,
  StoragePlanController,
  BatchController,
  RoomController,
  DashboardController,
  RevisionController,
  PdfJsApiController,
  AdminController,
  AmbController,
  CommentController,
  RedactionController,
  NotificationController
];

const finalMiddlewareControllers = [ErrorController];

const controllerTypes = [
  ...setupControllers,
  ...pageAndApiControllers,
  ...finalMiddlewareControllers
];

class ControllerFactory {
  static dependencies = [Container];

  constructor(container) {
    this.container = container;
  }

  registerAdditionalControllers(additionalControllers) {
    controllerTypes.push(...additionalControllers);
  }

  getAllControllers() {
    return controllerTypes.map(ControllerType => this.container.get(ControllerType));
  }
}

export default ControllerFactory;
