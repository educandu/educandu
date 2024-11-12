import transliterate from '@sindresorhus/transliterate';

export default class Educandu_2024_11_12_02_add_searchTags_to_media_library_items {
  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName) {
    const docsIterator = await this.db.collection(collectionName).find({});

    let updateCount = 0;

    for await (const doc of docsIterator) {
      updateCount += 1;
      const searchTags = doc.tags.map(tag => transliterate(tag));
      await this.db.collection(collectionName).updateOne({ _id: doc._id }, { $set: { searchTags } });
    }

    return updateCount;
  }

  async up() {
    const count = await this.processCollection('mediaLibraryItems');

    await this.db.collection('mediaLibraryItems').createIndexes([
      {
        name: '_idx_searchTags_',
        key: { searchTags: 1 }
      },
    ]);

    console.log(`Updated ${count} mediaLibraryItems`);
  }

  down() {
    throw Error('Not supported');
  }
}
