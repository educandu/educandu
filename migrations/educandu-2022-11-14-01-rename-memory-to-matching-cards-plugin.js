/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_11_14_01_rename_memory_to_matching_cards_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].type': 'matching-cards'
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'memory'
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
        $set: {
          'sections.$[sectionElement].type': 'memory'
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'matching-cards'
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
