/* eslint-disable camelcase, no-console */
export default class Educandu_2022_07_08_01_add_alignments_to_cells_in_table_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.cells.$[].verticalAlignment': 'top',
          'sections.$[sectionElement].content.cells.$[].horizontalAlignment': 'left'
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'table',
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
          'sections.$[sectionElement].content.cells.$[].verticalAlignment': null,
          'sections.$[sectionElement].content.cells.$[].horizontalAlignment': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'table',
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
