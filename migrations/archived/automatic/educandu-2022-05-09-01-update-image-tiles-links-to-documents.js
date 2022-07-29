/* eslint-disable camelcase, no-await-in-loop, max-depth, no-console */
export default class Educandu_2022_05_09_01_update_image_tiles_links_to_documents {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ $and: [
      { 'sections.type': 'image-tiles' },
      { 'sections.content.tiles.link.sourceType': 'document' }
    ] }).toArray();

    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;

      for (const section of doc.sections) {
        if (section.type === 'image-tiles' && section.content) {

          for (const tile of section.content.tiles) {
            if (tile.link.sourceType === 'document' && tile.link.documentId && tile.link.documentId.includes('/')) {

              const documentId = tile.link.documentId.match(/\/?(?:docs|articles)?\/?([a-zA-Z0-9]+)\b/)?.[1];
              if (!documentId) {
                throw new Error(`Could not extract document ID from '${tile.link.documentId}' in section ${section._id} of ${collectionName} ${doc._id}`);
              }

              console.log(`Updating ${collectionName} ${doc._id} - section ${section.key} - setting '${documentId}' from '${tile.link.documentId}'`);

              tile.link.documentId = documentId;
              docWasUpdated = true;
            }
          }
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

  down() {
    throw new Error('Not implemented');
  }
}
