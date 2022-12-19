export default class Educandu_2022_05_10_03_add_source_start_and_stop_timecode_to_interactive_media {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.sourceStartTimecode': null,
          'sections.$[sectionElement].content.sourceStopTimecode': null
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
          'sections.$[sectionElement].content.sourceStartTimecode': null,
          'sections.$[sectionElement].content.sourceStopTimecode': null
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
