/* eslint-disable camelcase, no-console, no-await-in-loop */
export default class Educandu_2022_04_21_04_rename_type_and_url_in_image_tiles_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'image-tiles' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'image-tiles' && section.content) {
          for (const tile of section.content.tiles) {
            // eslint-disable-next-line max-depth
            if (tile.image) {
              tile.image.sourceType = tile.image.type;
              tile.image.sourceUrl = tile.image.url;
              delete tile.image.type;
              delete tile.image.url;
              docWasUpdated = true;
            }
            // eslint-disable-next-line max-depth
            if (tile.link) {
              tile.link.sourceType = tile.link.type === 'external' ? 'external' : 'document';
              tile.link.sourceUrl = tile.link.type === 'external' ? tile.link.url : '';
              tile.link.documentId = tile.link.type === 'external' ? '' : tile.link.url;
              delete tile.link.type;
              delete tile.link.url;
              docWasUpdated = true;
            }
          }
          console.log(`Updating ${collectionName} ${doc._id} - section ${section.key}`);
        }
      }
      if (docWasUpdated) {
        updateCount += 1;
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }

    return updateCount;
  }

  async collectionDown(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'image-tiles' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'image-tiles' && section.content) {
          for (const tile of section.content.tiles) {
            // eslint-disable-next-line max-depth
            if (tile.image) {
              tile.image.type = tile.image.sourceType;
              tile.image.url = tile.image.sourceUrl;
              delete tile.image.sourceType;
              delete tile.image.sourceUrl;
              docWasUpdated = true;
            }
            // eslint-disable-next-line max-depth
            if (tile.link) {
              tile.link.type = tile.link.sourceType === 'external' ? 'external' : 'internal';
              tile.link.url = tile.link.sourceType === 'external' ? tile.link.sourceUrl : tile.link.documentId;
              delete tile.link.sourceType;
              delete tile.link.sourceUrl;
              delete tile.link.documentId;
              docWasUpdated = true;
            }
          }
          console.log(`Updating ${collectionName} ${doc._id} - section ${section.key}`);
        }
      }
      if (docWasUpdated) {
        updateCount += 1;
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }

    return updateCount;
  }

  async up() {
    const lessonsCount = await this.collectionUp('lessons');
    const documentsCount = await this.collectionUp('documents');
    const documentRevisionsCount = await this.collectionUp('documentRevisions');

    console.log(`Updated ${lessonsCount} lessons, ${documentsCount} documents, ${documentRevisionsCount} documentRevisions`);
  }

  async down() {
    const lessonsCount = await this.collectionDown('lessons');
    const documentsCount = await this.collectionDown('documents');
    const documentRevisionsCount = await this.collectionDown('documentRevisions');

    console.log(`Updated ${lessonsCount} lessons, ${documentsCount} documents, ${documentRevisionsCount} documentRevisions`);
  }
}
