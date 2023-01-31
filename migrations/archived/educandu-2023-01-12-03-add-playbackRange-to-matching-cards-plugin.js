export default class Educandu_2023_01_12_03_add_playbackRange_to_matching_cards_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.tilePairs.$[].$[].playbackRange': [0, 1]
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'matching-cards',
            'sectionElement.content': { $ne: null }
          }
        ],
        multi: true
      }
    );

    console.log(`Updated ${collectionName}: ${JSON.stringify(result)}`);
  }

  async collectionDown(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.tilePairs.$[].$[].playbackRange': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'matching-cards',
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

  async down() {
    await this.collectionDown('documents');
    await this.collectionDown('documentRevisions');
  }
}
