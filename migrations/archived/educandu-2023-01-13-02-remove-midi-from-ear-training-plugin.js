export default class Educandu_2023_01_13_02_remove_midi_from_ear_training_plugin {

  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'ear-training' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {

        if (section.type === 'ear-training' && section.content) {
          section.content.tests.forEach(test => {
            delete test.sound.useMidi;
          });
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
    const documentsCount = await this.processCollection('documents');
    const documentRevisionsCount = await this.processCollection('documentRevisions');

    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }

  down() {
    throw Error('Not supported');
  }
}
