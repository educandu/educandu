/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_05_03_01_add_sourceDuration_and_chapters_to_interactive_media_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.sourceDuration': 0,
          'sections.$[sectionElement].content.chapters': [{ startTimecode: 0, title: '', key: '' }]
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'interactive-media',
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
          'sections.$[sectionElement].content.sourceDuration': 0,
          'sections.$[sectionElement].content.chapters': [{ startTimecode: 0, title: '', key: '' }]
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'interactive-media',
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
