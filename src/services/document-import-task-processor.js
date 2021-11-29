import ExportApiClient from './export-api-client.js';
import ServerConfig from '../bootstrap/server-config.js';
import { getImportSourceBaseUrl } from '../utils/urls.js';

const delay = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

export class DocumentImportTaskProcessor {
  static get inject() {
    return [ServerConfig, ExportApiClient];
  }

  constructor(serverConfig, exportApiClient) {
    this.serverConfig = serverConfig;
    this.exportApiClient = exportApiClient;
  }

  async process(task, batchParams, ctx) {
    await delay(2000);
    if (ctx.cancellationRequested) {
      throw new Error();
    }

    const importSource = this.serverConfig.importSources.find(({ hostName }) => hostName === batchParams.hostName);
    const { key, importedRevision, importableRevision } = task.taskParams;

    const documentExport = await this.exportApiClient.getDocumentExport({
      baseUrl: getImportSourceBaseUrl(importSource),
      apiKey: importSource.apiKey,
      documentKey: key,
      fromRevision: importedRevision,
      toRevision: importableRevision
    });

    if (Math.random() > 0.5) {
      throw new Error('Mäh');
    }
  }
}
