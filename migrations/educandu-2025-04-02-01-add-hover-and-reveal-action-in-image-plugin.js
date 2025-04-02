export default class Educandu_2025_04_02_01_add_hover_and_reveal_action_in_image_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    // Set new properties to their default value
    const result1 = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.hoverEffect.hoverAction': 'switch',
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

    // Set the action for images that use reveal effect to "overlay" to
    // keep current behavior of these images after migration
    const result2 = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.revealEffect.revealAction': 'overlay'
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'image',
            'sectionElement.content': { $ne: null },
            'sectionElement.content.effectType': 'reveal'
          }
        ],
        multi: true
      }
    );

    console.log(`Updated ${collectionName}: ${JSON.stringify(result1)}`);
    console.log(`Updated ${collectionName}: ${JSON.stringify(result2)}`);
  }

  async up() {
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  down() {
    throw new Error('Not supported');
  }
}
