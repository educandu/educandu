export default class Educandu_2023_11_20_02_add_midi_sound_to_ear_training_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const pluginType = 'ear-training';
    const cursor = this.db.collection(collectionName).find({ 'sections.type': pluginType });

    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      for (const section of doc.sections) {
        if (section.type === pluginType && !!section.content) {
          for (const test of section.content.tests) {
            test.testMode = test.mode;

            if (test.testMode === 'abcCode') {
              test.questionImage = {
                sourceUrl: '',
                copyrightNotice: ''
              };
              test.answerImage = {
                sourceUrl: '',
                copyrightNotice: ''
              };
            } else {
              test.questionAbcCode = '';
              test.answerAbcCode = '';
            }

            test.soundMode = 'source';
            test.sourceSound = test.sound;
            test.abcMidiSound = {
              initialVolume: 1
            };

            delete test.mode;
            delete test.sound;
          }
          count += 1;
        }
      }

      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
    }

    console.log(`Migrated ${count} '${pluginType}' sections in ${collectionName}`);
  }

  async up() {
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  down() {
    throw Error('Not supported');
  }
}
