import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentCategoryDbSchema } from '../domain/schemas/document-category-schemas.js';

class CategoryStore {
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

  getDocumentCategoriesByDocumentId(documentId, { session } = {}) {
    return this.collection.find({ documentIds: documentId }, { session }).toArray();
  }

  saveDocumentCategory(documentCategory, { session } = {}) {
    validate(documentCategory, documentCategoryDbSchema);
    return this.collection.replaceOne({ _id: documentCategory._id }, documentCategory, { session, upsert: true });
  }

  deleteDocumentCategoryById(documentCategoryId, { session } = {}) {
    return this.collection.deleteOne({ _id: documentCategoryId }, { session });
  }
}

export default CategoryStore;
