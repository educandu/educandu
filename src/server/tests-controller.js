import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';

class TestsController {
  static get inject() { return [PageRenderer]; }

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  handleGetTestsPage(req, res) {
    const initialState = {};

    // Hack
    req.storage = {
      ...req.storage,
      locations: [
        {
          type: STORAGE_LOCATION_TYPE.public,
          rootPath: 'media',
          initialPath: 'media',
          uploadPath: 'media',
          isDeletionEnabled: hasUserPermission(req.user, permissions.DELETE_ANY_STORAGE_FILE)
        }
      ]
    };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.tests, initialState);
  }

  registerPages(router) {
    router.get(
      '/tests',
      (req, res) => this.handleGetTestsPage(req, res)
    );
  }
}

export default TestsController;
