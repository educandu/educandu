import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import { SAVE_DOCUMENT_CATEGORY_RESULT } from '../domain/constants.js';
import DocumentCategoryStore from  '../stores/document-category-store.js';

const logger = new Logger(import.meta.url);

class DocumentCategoryService {
  static dependencies = [DocumentCategoryStore];

  constructor(documentCategoryStore) {
    this.documentCategoryStore = documentCategoryStore;
  }

  async createDocumentCategory({ name, iconUrl, description, user }) {
    const existingDocumentCategoryName = await this.documentCategoryStore.findDocumentCategoryByName(name);
    if (existingDocumentCategoryName) {
      return { result: SAVE_DOCUMENT_CATEGORY_RESULT.duplicateName, documentCategory: null };
    }

    const documentCategory = this._buildDocumentCategory({ name,description, iconUrl, user });

    logger.info(`Creating new document category with _id ${documentCategory._id} `);

    await this.documentCategoryStore.saveDocumentCategory(documentCategory);

    return { result: SAVE_DOCUMENT_CATEGORY_RESULT.success, documentCategory };
  }

  _buildDocumentCategory({ name, description, iconUrl, user }) {
    const now = new Date();

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
      cdnResources: []
    };
  }
}

export default DocumentCategoryService;
