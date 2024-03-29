import uniqueId from '../../src/utils/unique-id.js';

export default class Educandu_2023_02_09_03_add_key_to_quick_tester_plugin_tests {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.tests.$[].key': uniqueId.create()
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'quick-tester',
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
          'sections.$[sectionElement].content.tests.$[].key': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'quick-tester',
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
