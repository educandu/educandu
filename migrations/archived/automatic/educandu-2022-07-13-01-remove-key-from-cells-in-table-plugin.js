/* eslint-disable camelcase, no-console, no-await-in-loop */
import uniqueId from '../../../src/utils/unique-id.js';

export default class Educandu_2022_07_13_01_remove_key_from_cells_in_table_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.cells.$[].key': null
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
    const docsToUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'table' }).toArray();

    for (const doc of docsToUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'table' && section.content) {
          section.content.cells.forEach(cell => {
            cell.key = uniqueId.create();
          });

          docWasUpdated = true;
        }
      }
      if (docWasUpdated) {
        console.log(`Updating ${collectionName}: ${doc._id}`);
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }
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
