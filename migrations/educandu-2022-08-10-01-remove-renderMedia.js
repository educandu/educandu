export default class Educandu_2022_08_10_01_remove_renderMedia {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.renderMedia': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': { $in: ['quick-tester', 'table', 'annotation', 'markdown'] },
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
        $set: {
          'sections.$[sectionElement].content.renderMedia': true
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': { $in: ['quick-tester', 'table', 'annotation', 'markdown'] },
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
