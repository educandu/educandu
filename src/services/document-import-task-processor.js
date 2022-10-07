/* eslint-disable no-await-in-loop */
import by from 'thenby';
import routes from '../utils/routes.js';
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
    const { documentId, importedRevision, importableRevision } = task.taskParams;

    const documentExport = await this.exportApiClient.getDocumentExport({
      baseUrl: routes.getImportSourceBaseUrl(importSource),
      apiKey: importSource.apiKey,
      documentId,
      toRevision: importableRevision,
      includeEmails: batchParams.nativeImport || false
    });

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    if (batchParams.nativeImport) {
      const userMap = {};
      for (const user of documentExport.users) {
        const userId = await this.userService.ensureInternalUser({ _id: user._id, displayName: user.displayName, email: user.email });
        userMap[user._id] = userId;
      }

      documentExport.revisions.forEach(revision => {
        revision.createdBy = userMap[revision.createdBy];
        revision.sections.forEach(section => {
          if (section.deletedBy) {
            section.deletedBy = userMap[section.deletedBy];
          }
        });
      });

    } else {
      await Promise.all(documentExport.users
        .map(user => this.userService.ensureExternalUser({ _id: user._id, displayName: user.displayName, hostName: batchParams.hostName })));
    }

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

    const docUrl = routes.getDocUrl({ id: sortedRevisions[0].documentId, slug: sortedRevisions[0].slug });
    const baseUrl = routes.getImportSourceBaseUrl(importSource);

    const originUrl = batchParams.nativeImport ? null : `${baseUrl}${docUrl}`;
    const origin = batchParams.nativeImport ? DOCUMENT_ORIGIN.internal : `${DOCUMENT_ORIGIN.external}/${batchParams.hostName}`;

    await this.documentService.importDocumentRevisions({
      documentId,
      revisions: sortedRevisions,
      ancestorId: importedRevision,
      origin,
      originUrl
    });
  }
}

export default DocumentImportTaskProcessor;
