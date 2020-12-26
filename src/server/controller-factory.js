import { Container } from '../common/di';
import CdnController from './cdn-controller';
import UserController from './user-controller';
import MenuController from './menu-controller';
import IndexController from './index-controller';
import ErrorController from './error-controller';
import StaticController from './static-controller';
import PluginController from './plugin-controller';
import SettingController from './setting-controller';
import DocumentController from './document-controller';

const controllerTypes = [
  StaticController,
  IndexController,
  UserController,
  SettingController,
  DocumentController,
  MenuController,
  CdnController,
  PluginController,
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
