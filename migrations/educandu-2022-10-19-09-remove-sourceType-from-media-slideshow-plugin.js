/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_10_19_09_remove_sourceType_from_media_slideshow_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.sourceType': null,
          'sections.$[sectionElement].content.chapters.$[].sourceType': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'media-slideshow',
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
