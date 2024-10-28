export default class Educandu_2024_10_28_01_add_multitrackPlayerType_to_combined_multitrack_media_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.player2.multitrackPlayerType': 'default'
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'combined-multitrack-media',
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
