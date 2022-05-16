import express from 'express';
import { resolvePathWithinPackage } from '../utils/path-utils.js';

class PdfJsApiController {
  registerMiddleware(router) {
    router.use(
      '/api/v1/pdfjs-dist/build',
      express.static(resolvePathWithinPackage('pdfjs-dist', './legacy/build'))
    );

    router.use(
      '/api/v1/pdfjs-dist/cmaps',
      express.static(resolvePathWithinPackage('pdfjs-dist', './cmaps'))
    );
  }
}

export default PdfJsApiController;
