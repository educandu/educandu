/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_04_20_01_add_intent_and_state_to_annotation_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.intent': 'neutral',
          'sections.$[sectionElement].content.behavior': 'expandable',
          'sections.$[sectionElement].content.width': 100
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'annotation',
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
          'sections.$[sectionElement].content.intent': null,
          'sections.$[sectionElement].content.behavior': null,
          'sections.$[sectionElement].content.width': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'annotation',
            'sectionElement.content': { $ne: null }
          }
        ],
        multi: true
      }
    );

    console.log(`Updated ${collectionName}: ${JSON.stringify(result)}`);
  }

  async up() {
    await this.collectionUp('lessons');
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  async down() {
    await this.collectionDown('lessons');
    await this.collectionDown('documents');
    await this.collectionDown('documentRevisions');
  }
}
