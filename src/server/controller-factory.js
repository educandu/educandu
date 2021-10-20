import { Container } from '../common/di';
import CdnController from './cdn-controller';
import I18nController from './i18n-controller';
import UserController from './user-controller';
import MenuController from './menu-controller';
import IndexController from './index-controller';
import ErrorController from './error-controller';
import StaticController from './static-controller';
import DocumentController from './document-controller';
import SettingsController from './settings-controller';

const controllerTypes = [
  StaticController,
  I18nController,
  SettingsController,
  IndexController,
  UserController,
  DocumentController,
  MenuController,
  CdnController,
  ErrorController
];

class ControllerFactory {
  static get inject() { return [Container]; }

  constructor(container) {
    this.container = container;
  }

  getAllControllers() {
    return controllerTypes.map(ControllerType => this.container.get(ControllerType));
  }
}

export default ControllerFactory;
