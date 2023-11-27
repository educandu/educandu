export default class Educandu_2023_11_20_01_add_playMidi_to_abc_notation_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.playMidi': false
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'abc-notation',
            'sectionElement.content': { $ne: null }
          }
        ],
        multi: true
      }
    );

    console.log(`Updated ${collectionName}: ${JSON.stringify(result)}`);
  }

  async up() {
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  down() {
    throw Error('Not supported');
  }
}
