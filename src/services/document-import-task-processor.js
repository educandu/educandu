import UserService from './user-service.js';
import ExportApiClient from './export-api-client.js';
import ServerConfig from '../bootstrap/server-config.js';
import { getImportSourceBaseUrl } from '../utils/urls.js';

export class DocumentImportTaskProcessor {
  static get inject() {
    return [ServerConfig, ExportApiClient, UserService];
  }

  constructor(serverConfig, exportApiClient, userService) {
    this.serverConfig = serverConfig;
    this.exportApiClient = exportApiClient;
    this.userService = userService;
  }

  async process(task, batchParams, ctx) {
    const importSource = this.serverConfig.importSources.find(({ hostName }) => hostName === batchParams.hostName);
    const { key, importedRevision, importableRevision } = task.taskParams;

    const response = await this.exportApiClient.getDocumentExport({
      baseUrl: getImportSourceBaseUrl(importSource),
      apiKey: importSource.apiKey,
      documentKey: key,
      afterRevision: importedRevision,
      toRevision: importableRevision
    });

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    await Promise.all(response.users.map(user => this.userService.ensureExternalUser({
      _id: user._id,
      username: user.username,
      hostName: batchParams.hostName
    })));
  }
}
