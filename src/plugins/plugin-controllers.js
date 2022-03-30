import PdfViewerController from './pdf-viewer/controller.js';

const controllerTypes = [PdfViewerController];

class PluginControllers {
  getPluginControllerTypes() {
    return controllerTypes;
  }
}

export default PluginControllers;
