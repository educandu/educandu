const pluginTypes = ['abc-notation', 'diagram-net', 'ear-training', 'image', 'image-tiles'];

export default class Educandu_2022_06_28_01_rename_max_width_to_width_in_all_plugins {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': { $in: pluginTypes } }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (pluginTypes.includes(section.type) && section.content) {
          section.content.width = section.content.maxWidth ?? 100;
          delete section.content.maxWidth;

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
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': { $in: pluginTypes } }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (pluginTypes.includes(section.type) && section.content) {
          section.content.maxWidth = section.content.width;
          delete section.content.width;

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
