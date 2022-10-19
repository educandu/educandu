/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_10_18_01_remove_sourceType_from_audio_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.sourceType': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'audio',
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
