export default class Educandu_2023_02_13_01_rename_source_types_in_catalog_plugin_items {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const cursor = this.db.collection(collectionName).find({ 'sections.type': 'catalog' });

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      let isUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'catalog' && !!section.content) {
          for (const item of section.content.items) {
            if (item.link.sourceType === 'external') {
              item.link.sourceType = 'sourceUrl';
              isUpdated = true;
            }
            if (item.link.sourceType === 'document') {
              item.link.sourceType = 'documentId';
              isUpdated = true;
            }
          }
        }
      }

      if (isUpdated) {
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
        console.log(`Updated ${collectionName} - ${doc._id}`);
      }
    }
  }

  async collectionDown(collectionName) {
    const cursor = this.db.collection(collectionName).find({ 'sections.type': 'catalog' });

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      let isUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'catalog' && !!section.content) {
          for (const item of section.content.items) {
            if (item.link.sourceType === 'sourceUrl') {
              item.link.sourceType = 'external';
              isUpdated = true;
            }
            if (item.link.sourceType === 'documentId') {
              item.link.sourceType = 'document';
              isUpdated = true;
            }
          }
        }
      }

      if (isUpdated) {
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
        console.log(`Updated ${collectionName} - ${doc._id}`);
      }
    }
  }

  async up() {
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  async down() {
    await this.collectionDown('documents');
    await this.collectionDown('documentRevisions');
  }
}
