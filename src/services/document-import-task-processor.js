/* eslint-disable no-await-in-loop */
import by from 'thenby';
import urls from '../utils/urls.js';
import Cdn from '../repositories/cdn.js';
import Logger from '../common/logger.js';
import UserService from './user-service.js';
import DocumentService from './document-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import { DOCUMENT_ORIGIN } from '../domain/constants.js';
import ExportApiClient from '../api-clients/export-api-client.js';

const logger = new Logger(import.meta.url);

class DocumentImportTaskProcessor {
  static get inject() {
    return [ServerConfig, ExportApiClient, UserService, Cdn, DocumentService];
  }

  constructor(serverConfig, exportApiClient, userService, cdn, documentService) {
    this.serverConfig = serverConfig;
    this.exportApiClient = exportApiClient;
    this.userService = userService;
    this.cdn = cdn;
    this.documentService = documentService;
  }

  async process(task, batchParams, ctx) {
    const importSource = this.serverConfig.importSources.find(({ hostName }) => hostName === batchParams.hostName);
    const { key, importedRevision, importableRevision } = task.taskParams;

    const documentExport = await this.exportApiClient.getDocumentExport({
      baseUrl: urls.getImportSourceBaseUrl(importSource),
      apiKey: importSource.apiKey,
      documentKey: key,
      toRevision: importableRevision
    });

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    await Promise.all(documentExport.users
      .map(user => this.userService.ensureExternalUser({ _id: user._id, username: user.username, hostName: batchParams.hostName })));

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    const sortedRevisions = documentExport.revisions.sort(by(revision => revision.order));
    const allCdnResources = new Set(sortedRevisions.map(revision => revision.cdnResources).flat());

    for (const cdnResource of allCdnResources) {
      if (await this.cdn.objectExists(cdnResource)) {
        logger.info(`CDN resource '${cdnResource}' already exists, skipping upload`);
      } else {
        logger.info(`Uploading CDN resource '${cdnResource}'`);
        const url = `${documentExport.cdnRootUrl}/${encodeURI(cdnResource)}`;
        await this.cdn.uploadObjectFromUrl(cdnResource, url);
      }

      if (ctx.cancellationRequested) {
        throw new Error('Cancellation requested');
      }
    }

    const docUrl = urls.getDocUrl({ key: sortedRevisions[0].key, slug: sortedRevisions[0].slug });
    const baseUrl = urls.getImportSourceBaseUrl(importSource);

    const originUrl = `${baseUrl}${docUrl}`;
    const origin = `${DOCUMENT_ORIGIN.external}/${batchParams.hostName}`;

    await this.documentService.importDocumentRevisions({
      documentKey: key,
      revisions: sortedRevisions,
      ancestorId: importedRevision,
      origin,
      originUrl
    });
  }
}

export default DocumentImportTaskProcessor;
