export default class Educandu_2025_03_27_01_remove_unused_properties_in_list_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.itemTemplate': null,
          'sections.$[sectionElement].content.customLabels': null,
          'sections.$[sectionElement].content.items': null,
          'sections.$[sectionElement].content.searchTags': null,
          'sections.$[sectionElement].content.isCC0Music': null,
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'benewagner/educandu-plugin-list',
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
