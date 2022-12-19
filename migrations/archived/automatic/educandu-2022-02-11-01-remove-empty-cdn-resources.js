export default class Educandu_2022_02_11_01_remove_empty_cdn_resources {
  constructor(db) {
    this.db = db;
  }

  async updateDocumentsInCollection(collectionName) {
    const docsToUpdate = await this.db.collection(collectionName).find({ cdnResources: { $elemMatch: { $eq: '' } } }).toArray();

    for (const doc of docsToUpdate) {
      if (doc.cdnResources.some(resource => !resource)) {
        console.log(`Updating record '${doc._id}' in collection '${collectionName}'`);
        const sanitizedCdnResources = doc.cdnResources.filter(resource => !!resource);
        await this.db.collection(collectionName).updateOne({ _id: doc._id }, { $set: { cdnResources: sanitizedCdnResources } });
      }
    }
  }

  async up() {
    await this.updateDocumentsInCollection('documentRevisions');
    await this.updateDocumentsInCollection('documents');
    await this.updateDocumentsInCollection('lessons');
  }

  async down() {}
}
