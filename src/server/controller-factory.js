import { Container } from '../common/di.js';
import CdnController from './cdn-controller.js';
import I18nController from './i18n-controller.js';
import UserController from './user-controller.js';
import IndexController from './index-controller.js';
import ErrorController from './error-controller.js';
import RoomController from './room-controller.js';
import StaticController from './static-controller.js';
import ImportController from './import-controller.js';
import ExportController from './export-controller.js';
import SettingsController from './settings-controller.js';
import DocumentController from './document-controller.js';
import UserAgentController from './user-agent-controller.js';

const controllerTypes = [
  StaticController,
  I18nController,
  UserAgentController,
  SettingsController,
  IndexController,
  UserController,
  DocumentController,
  CdnController,
  ExportController,
  ImportController,
  ErrorController,
  RoomController
];

class ControllerFactory {
  static get inject() { return [Container]; }

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
