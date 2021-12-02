/* eslint-disable no-await-in-loop */
import by from 'thenby';
import Cdn from '../repositories/cdn.js';
import UserService from './user-service.js';
import DocumentService from './document-service.js';
import ExportApiClient from './export-api-client.js';
import ServerConfig from '../bootstrap/server-config.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';
import { getDocUrl, getImportSourceBaseUrl } from '../utils/urls.js';

class DocumentImportTaskProcessor {
  static get inject() {
    return [ServerConfig, ExportApiClient, UserService, DocumentService, Cdn];
  }

  constructor(serverConfig, exportApiClient, userService, documentService, cdn) {
    this.serverConfig = serverConfig;
    this.exportApiClient = exportApiClient;
    this.userService = userService;
    this.documentService = documentService;
    this.cdn = cdn;
  }

  async process(task, batchParams, ctx) {
    const importSource = this.serverConfig.importSources.find(({ hostName }) => hostName === batchParams.hostName);
    const { key, importedRevision, importableRevision } = task.taskParams;

    const documentExport = await this.exportApiClient.getDocumentExport({
      baseUrl: getImportSourceBaseUrl(importSource),
      apiKey: importSource.apiKey,
      documentKey: key,
      afterRevision: importedRevision,
      toRevision: importableRevision
    });

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    await Promise.all(documentExport.users.map(user => this.userService.ensureExternalUser({
      _id: user._id,
      username: user.username,
      hostName: batchParams.hostName
    })));

    const sortedRevisions = documentExport.revisions.sort(by(revision => revision.order));

    for (const revision of sortedRevisions) {
      const previousRevision = await this.documentService.getCurrentDocumentRevisionByKey(revision.key);

      const user = await this.userService.getUserById(revision.createdBy);
      const baseUrl = getImportSourceBaseUrl(importSource);
      const docUrl = getDocUrl(revision.key);

      for (const resource of revision.cdnResources) {
        const url = `${documentExport.cdnRootUrl || 'https://cdn.integration.openmusic.academy/'}/${resource}`;
        await this.cdn.uploadObjectFromUrl(resource, url);
      }

      const mappedRevision = {
        ...revision,
        origin: `${DOCUMENT_ORIGIN.external}/${batchParams.hostName}`,
        originUrl: `${baseUrl}${docUrl}`,
        appendTo: previousRevision
          ? {
            key: revision.key,
            ancestorId: previousRevision._id
          }
          : null
      };

      await this.documentService.copyDocumentRevision({ doc: mappedRevision, user });
    }
  }
}

export default DocumentImportTaskProcessor;
