/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_04_04_01_only_allow_internal_sources_and_canvas_rendering_in_pdf_viewer {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'pdf-viewer' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'pdf-viewer' && section.content) {
          if (section.content.sourceType !== 'internal') {
            section.content.sourceType = 'internal';
            section.content.sourceUrl = '';
          }
          delete section.content.renderMode;
          docWasUpdated = true;
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
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'pdf-viewer' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'pdf-viewer' && section.content) {
          section.content.renderMode = 'canvas';
          docWasUpdated = true;
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
