/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_10_20_01_add_interactivity_to_audio_waveform_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.displayMode': 'static',
          'sections.$[sectionElement].content.interactivityConfig': {
            penColor: '#69c0ff',
            baselineColor: '#e6f7ff',
            backgroundColor: '#003a8c',
            opacityWhenResolved: 0.5
          }
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'audio-waveform',
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
          'sections.$[sectionElement].content.displayMode': null,
          'sections.$[sectionElement].content.interactivityConfig': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'audio-waveform',
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
