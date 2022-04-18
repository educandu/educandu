import ClientConfig from '../bootstrap/client-config.js';
import PdfViewerController from './pdf-viewer/pdf-viewer-controller.js';

const allPossibleControllerTypes = [PdfViewerController];

class PluginControllers {
  static get inject() { return [ClientConfig]; }

  constructor(clientConfig) {
    this.controllerTypes = clientConfig.plugins.reduce((accu, typeName) => {
      const controllerType = allPossibleControllerTypes.find(type => type.typeName === typeName);
      return controllerType ? [...accu, controllerType] : accu;
    }, []);
  }

  getPluginControllerTypes() {
    return this.controllerTypes;
  }
}

export default PluginControllers;
