import Database from '../stores/database.js';
import AmbService from '../services/amb-service.js';
import requestUtils from '../utils/request-utils.js';
import ServerConfig from '../bootstrap/server-config.js';
import needsApiKey from '../domain/needs-api-key-middleware.js';

class AmbController {
  static get inject() { return [ServerConfig, AmbService, Database]; }

  constructor(serverConfig, ambService, database) {
    this.serverConfig = serverConfig;
    this.ambService = ambService;
    this.database = database;
  }

  async handleGetAmbMetadata(req, res) {
    const { hostInfo } = requestUtils.expressReqToRequest(req);
    const metadata = await this.ambService.getDocumentsAmbMetadata({ origin: hostInfo.origin });
    return res.send(metadata);
  }

  registerApi(router) {
    const expectedApiKey = this.serverConfig.ambConfig?.apiKey || null;
    if (expectedApiKey) {
      router.get(
        '/api/v1/amb/metadata',
        needsApiKey(expectedApiKey),
        (req, res) => this.handleGetAmbMetadata(req, res)
      );
    }
  }
}

export default AmbController;
