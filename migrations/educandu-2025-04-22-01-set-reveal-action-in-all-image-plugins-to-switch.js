export default class Educandu_2025_04_22_01_set_reveal_action_in_all_image_plugins_to_switch {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.revealEffect.revealAction': 'switch'
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
    throw new Error('Not supported');
  }
}
