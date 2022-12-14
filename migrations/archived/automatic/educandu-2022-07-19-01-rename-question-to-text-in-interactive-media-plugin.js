export default class Educandu_2022_07_19_01_rename_question_to_text_in_interactive_media_plugin {
  constructor(db) {
    this.db = db;
  }

  renameProperty(item, oldName, newName) {
    item[newName] = item[oldName];
    delete item[oldName];
  }

  async processCollection(collectionName, oldName, newName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'interactive-media' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'interactive-media' && section.content) {
          for (const chapter of section.content.chapters) {
            this.renameProperty(chapter, oldName, newName);
            docWasUpdated = true;
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

  collectionUp(collectionName) {
    return this.processCollection(collectionName, 'question', 'text');
  }

  collectionDown(collectionName) {
    return this.processCollection(collectionName, 'text', 'question');
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
