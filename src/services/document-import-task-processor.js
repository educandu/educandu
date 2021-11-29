import ExportApiClient from './export-api-client.js';
import ServerConfig from '../bootstrap/server-config.js';

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

    const importSource = this.serverConfig.importSources.find(({ name }) => name === batchParams.source);
    const { key, importedRevision, importableRevision } = task.taskParams;

    const documentExport = await this.exportApiClient.getDocumentExport({
      baseUrl: importSource.baseUrl,
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
