import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import LockStore from '../stores/lock-store.js';
import { isInternalSourceType } from '../utils/source-utils.js';
import TransactionRunner from '../stores/transaction-runner.js';
import { SAVE_DOCUMENT_CATEGORY_RESULT } from '../domain/constants.js';
import DocumentCategoryStore from  '../stores/document-category-store.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';

const logger = new Logger(import.meta.url);

class DocumentCategoryService {
  static dependencies = [DocumentCategoryStore, LockStore, TransactionRunner, GithubFlavoredMarkdown];

  constructor(documentCategoryStore, lockStore, transactionRunner, githubFlavoredMarkdown) {
    this.lockStore = lockStore;
    this.transactionRunner = transactionRunner;
    this.documentCategoryStore = documentCategoryStore;
    this.githubFlavoredMarkdown = githubFlavoredMarkdown;
  }

  async createDocumentCategory({ name, iconUrl, description, user }) {
    const existingDocumentCategoryName = await this.documentCategoryStore.findDocumentCategoryByName(name);
    if (existingDocumentCategoryName) {
      return { result: SAVE_DOCUMENT_CATEGORY_RESULT.duplicateName, documentCategory: null };
    }

    const documentCategory = this._buildDocumentCategory({ name, description, iconUrl, user });

    logger.info(`Creating new document category with _id ${documentCategory._id} `);

    await this.documentCategoryStore.saveDocumentCategory(documentCategory);

    return { result: SAVE_DOCUMENT_CATEGORY_RESULT.success, documentCategory };
  }

  async consolidateCdnResources(documentCategoryId) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentCategoryLock(documentCategoryId);
      await this.transactionRunner.run(async session => {
        const documentCategory = await this.documentCategoryStore.getDocumentCategoryById(documentCategoryId, { session });
        const consolidatedDocumentCategory = { ...documentCategory, cdnResources: this._extractCdnResources(documentCategory) };
        await this.documentCategoryStore.saveDocumentCategory(consolidatedDocumentCategory, { session });
      });
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  _buildDocumentCategory({ name, description, iconUrl, user }) {
    const now = new Date();
    const cdnResources = this._extractCdnResources({ iconUrl, description });

    return {
      _id: uniqueId.create(),
      name,
      description,
      iconUrl,
      createdOn: now,
      createdBy: user._id,
      updatedOn: now,
      updatedBy: user._id,
      documentIds: [],
      cdnResources
    };
  }

  _extractCdnResources({ iconUrl, description }) {
    const cdnResources = this.githubFlavoredMarkdown.extractCdnResources(description);

    if (!!iconUrl && isInternalSourceType({ url: iconUrl })) {
      cdnResources.push(iconUrl);
    }

    return cdnResources;
  }
}

export default DocumentCategoryService;
