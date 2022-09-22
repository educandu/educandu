/* eslint-disable camelcase, no-console, no-await-in-loop */

import slugify from '@sindresorhus/slugify';

export default class Educandu_2022_09_22_02_fix_invalid_slugs {
  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName) {
    const invalidSlugCondition = {
      $and: [
        { slug: { $ne: '' } },
        { slug: { $not: { $regex: /^[a-z0-9-]+(\/[a-z0-9-]+)*$/ } } }
      ]
    };

    const docsToUpdate = await this.db.collection(collectionName).find(invalidSlugCondition).toArray();

    for (const doc of docsToUpdate) {
      doc.slug = doc.slug.split('/').map(part => slugify(part)).filter(x => x).join('/');
      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
    }

    return docsToUpdate.length;
  }

  async up() {
    const documentsCount = await this.processCollection('documents');
    const documentRevisionsCount = await this.processCollection('documentRevisions');

    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }

  down() {
    throw new Error('Not available');
  }
}
