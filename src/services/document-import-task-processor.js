/* eslint-disable no-await-in-loop */
import by from 'thenby';
import Cdn from '../repositories/cdn.js';
import UserService from './user-service.js';
import DocumentService from './document-service.js';
import ExportApiClient from './export-api-client.js';
import ServerConfig from '../bootstrap/server-config.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentLockStore from '../stores/document-lock-store.js';
import { getDocUrl, getImportSourceBaseUrl } from '../utils/urls.js';

class DocumentImportTaskProcessor {
  static get inject() {
    return [ServerConfig, ExportApiClient, UserService, Cdn, DocumentLockStore, DocumentService, TransactionRunner];
  }

  constructor(serverConfig, exportApiClient, userService, cdn, documentLockStore, documentService, transactionRunner) {
    this.serverConfig = serverConfig;
    this.exportApiClient = exportApiClient;
    this.userService = userService;
    this.cdn = cdn;
    this.documentLockStore = documentLockStore;
    this.documentService = documentService;
    this.transactionRunner = transactionRunner;
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

    await Promise.all(documentExport.users
      .map(user => this.userService.ensureExternalUser({ _id: user._id, username: user.username, hostName: batchParams.hostName })));

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    const sortedRevisions = documentExport.revisions.sort(by(revision => revision.order));
    const allCdnResources = new Set(sortedRevisions.map(revision => revision.cdnResources).flat());

    for (const cdnResource of allCdnResources) {
      if (ctx.cancellationRequested) {
        throw new Error('Cancellation requested');
      }

      const url = `${documentExport.cdnRootUrl}/${cdnResource}`;
      await this.cdn.uploadObjectFromUrl(cdnResource, url);
    }

    let lock;
    try {
      lock = await this.documentLockStore.takeLock(key);

      await this.transactionRunner.run(async session => {
        for (const [index, revision] of sortedRevisions.entries()) {
          const previousRevision = await this.documentService.getCurrentDocumentRevisionByKey(revision.key);

          if (index === 0 && importedRevision && previousRevision?._id !== importedRevision) {
            throw new Error(`Import of document '${key}' expected to find revision '${importedRevision}' as the latest revision but found revision '${previousRevision?._id}'`);
          }

          const user = await this.userService.getUserById(revision.createdBy);
          const baseUrl = getImportSourceBaseUrl(importSource);
          const docUrl = getDocUrl(revision.key);

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

          const transaction = { session, lock };
          await this.documentService.copyDocumentRevision({ doc: mappedRevision, user, transaction });
        }
      });

    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }
}

export default DocumentImportTaskProcessor;
