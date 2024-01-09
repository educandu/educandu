export default class Educandu_2024_01_09_01_add_allowDragAndDrop_to_file_upload_field_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.allowDragAndDrop': true
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'file-upload-field',
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
    throw new Error('Not supported');
  }
}
