import express from 'express';
import { pluginControllerApiPath } from './constants.js';
import { resolvePathWithinPackage } from '../../utils/file-helper.js';

const staticRoutes = [
  {
    root: `${pluginControllerApiPath}/pdfjs-dist/build`,
    destination: resolvePathWithinPackage('pdfjs-dist', './legacy/build')
  },
  {
    root: `${pluginControllerApiPath}/pdfjs-dist/cmaps`,
    destination: resolvePathWithinPackage('pdfjs-dist', './cmaps')
  }
];

class PdfViewerController {
  static get typeName() { return 'pdf-viewer'; }

  registerMiddleware(router) {
    staticRoutes.forEach(({ root, destination }) => {
      router.use(root, express.static(destination));
    });
  }
}

export default PdfViewerController;
