import Database from '../stores/database.js';
import AmbService from '../services/amb-service.js';
import requestUtils from '../utils/request-utils.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import permissions from '../domain/permissions.js';

class AmbController {
  static get inject() { return [AmbService, Database]; }

  constructor(ambService, database) {
    this.ambService = ambService;
    this.database = database;
  }

  async handleGetAmbMetadata(req, res) {
    const { hostInfo } = requestUtils.expressReqToRequest(req);
    const metadata = await this.ambService.getDocumentsAmbMetadata({ origin: hostInfo.origin });
    return res.send(metadata);
  }

  registerApi(router) {
    router.get(
      '/api/v1/amb/metadata',
      needsPermission(permissions.REQUEST_AMB_METADATA_WITH_BUILT_IN_USER),
      (req, res) => this.handleGetAmbMetadata(req, res)
    );
  }
}

export default AmbController;
