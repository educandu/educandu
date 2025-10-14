import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentCategoryDbSchema } from '../domain/schemas/document-category-schemas.js';

const cdnResourceUsageMetadataProjection = {
  _id: 1,
  name: 1
};

class DocumentCategoryStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentCategories;
  }

  findDocumentCategoryByName(name, { session } = {}) {
    return this.collection.findOne({ name }, { session });
  }

  getAllDocumentCategories({ session } = {}) {
    return this.collection.find({}, { session }).toArray();
  }

  getAllDocumentCategoryIds({ session } = {}) {
    return this.collection.distinct('_id', {}, { session });
  }

  getAllCdnResourcesReferencedFromDocumentCategories() {
    return this.collection.distinct('cdnResources');
  }

  getAllDocumentCategoriesByReferencedCdnResourceName(cdnResourceName, { session } = {}) {
    return this.collection.find({ cdnResources: cdnResourceName }, { projection: cdnResourceUsageMetadataProjection, session }).toArray();
  }

  getDocumentCategoriesByDocumentId(documentId, { session } = {}) {
    return this.collection.find({ documentIds: documentId }, { session }).toArray();
  }

  getDocumentCategoryById(documentCategoryId, { session } = {}) {
    return this.collection.findOne({ _id: documentCategoryId }, { session });
  }

  saveDocumentCategory(documentCategory, { session } = {}) {
    validate(documentCategory, documentCategoryDbSchema);
    return this.collection.replaceOne({ _id: documentCategory._id }, documentCategory, { session, upsert: true });
  }

  deleteDocumentCategoryById(documentCategoryId, { session } = {}) {
    return this.collection.deleteOne({ _id: documentCategoryId }, { session });
  }
}

export default DocumentCategoryStore;
