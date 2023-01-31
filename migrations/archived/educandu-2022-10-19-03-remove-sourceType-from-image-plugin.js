export default class Educandu_2022_10_19_03_remove_sourceType_from_image_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.sourceType': null,
          'sections.$[sectionElement].content.hoverEffect.sourceType': null,
          'sections.$[sectionElement].content.revealEffect.sourceType': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'image',
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
