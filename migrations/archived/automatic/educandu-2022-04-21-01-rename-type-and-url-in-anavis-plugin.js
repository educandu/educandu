/* eslint-disable camelcase, no-console, no-await-in-loop */
export default class Educandu_2022_04_21_01_rename_type_and_url_in_anavis_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'anavis' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'anavis' && section.content) {
          section.content.media.sourceType = section.content.media.type;
          section.content.media.sourceUrl = section.content.media.url;
          delete section.content.media.type;
          delete section.content.media.url;

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
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'anavis' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'anavis' && section.content) {
          section.content.media.type = section.content.media.sourceType;
          section.content.media.url = section.content.media.sourceUrl;
          delete section.content.media.sourceType;
          delete section.content.media.sourceUrl;

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
