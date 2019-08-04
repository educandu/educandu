const { Container } = require('../common/di');
const CdnController = require('./cdn-controller');
const UserController = require('./user-controller');
const MenuController = require('./menu-controller');
const IndexController = require('./index-controller');
const ErrorController = require('./error-controller');
const StaticController = require('./static-controller');
const PluginController = require('./plugin-controller');
const SettingController = require('./setting-controller');
const DocumentController = require('./document-controller');

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

module.exports = ControllerFactory;
