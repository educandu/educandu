import by from 'thenby';
import UserService from './user-service.js';
import ExportApiClient from './export-api-client.js';
import ServerConfig from '../bootstrap/server-config.js';
import { getImportSourceBaseUrl } from '../utils/urls.js';
import DocumentService from './document-service.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';

export class DocumentImportTaskProcessor {
  static get inject() {
    return [ServerConfig, ExportApiClient, UserService, DocumentService];
  }

  constructor(serverConfig, exportApiClient, userService, documentService) {
    this.serverConfig = serverConfig;
    this.exportApiClient = exportApiClient;
    this.userService = userService;
    this.documentService = documentService;
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

    const sortedRevisions = response.revisions.sort(by(revision => revision.order));

    for (const revision of sortedRevisions) {
      /* eslint-disable-next-line no-await-in-loop */
      const user = await this.userService.getUserById(revision.createdBy);
      const mappedRevision = {
        ...revision,
        origin: `${DOCUMENT_ORIGIN.external}/${batchParams.hostName}`,
        cdnResources: revision.cdnResources,
        appendTo: null
      };

      /* eslint-disable-next-line no-await-in-loop */
      await this.documentService.copyDocumentRevision({ doc: mappedRevision, user });
    }
  }
}
