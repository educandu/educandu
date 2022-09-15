/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_09_12_01_add_type_to_media_slideshow_chapters {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.chapters.$[].type': 'image',
          'sections.$[sectionElement].content.chapters.$[].text': ''
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

  async collectionDown(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.chapters.$[].type': null,
          'sections.$[sectionElement].content.chapters.$[].text': null
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

  async down() {
    await this.collectionDown('documents');
    await this.collectionDown('documentRevisions');
  }
}
