import { Container } from '../common/di.js';
import RoomController from './room-controller.js';
import I18nController from './i18n-controller.js';
import UserController from './user-controller.js';
import IndexController from './index-controller.js';
import ErrorController from './error-controller.js';
import AdminController from './admin-controller.js';
import BatchController from './batch-controller.js';
import SearchController from './search-controller.js';
import StaticController from './static-controller.js';
import ImportController from './import-controller.js';
import ExportController from './export-controller.js';
import LessonController from './lesson-controller.js';
import StorageController from './storage-controller.js';
import SettingsController from './settings-controller.js';
import DocumentController from './document-controller.js';
import RevisionController from './revision-controller.js';
import DashboardController from './dashboard-controller.js';
import UserAgentController from './user-agent-controller.js';
import PluginControllers from '../plugins/plugin-controllers.js';

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
  ExportController,
  ImportController,
  BatchController,
  ErrorController,
  RoomController,
  DashboardController,
  LessonController,
  RevisionController,
  AdminController
];

class ControllerFactory {
  static get inject() { return [Container]; }

  constructor(container) {
    this.container = container;
  }

  registerPluginControllers() {
    const pluginControllers = this.container.get(PluginControllers);
    controllerTypes.push(...pluginControllers.getPluginControllerTypes());
  }

  registerAdditionalControllers(additionalControllers) {
    controllerTypes.push(...additionalControllers);
  }

  getAllControllers() {
    return controllerTypes.map(ControllerType => this.container.get(ControllerType));
  }
}

export default ControllerFactory;
