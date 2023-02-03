export default class Educandu_2023_02_03_01_add_initialVolume_to_media_plugins {
  constructor(db) {
    this.db = db;
  }

  async pluginUp(collectionName, pluginName) {
    await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.initialVolume': 1
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': pluginName,
            'sectionElement.content': { $ne: null }
          }
        ],
        multi: true
      }
    );
  }

  async pluginDown(collectionName, pluginName) {
    await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.initialVolume': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': pluginName,
            'sectionElement.content': { $ne: null }
          }
        ],
        multi: true
      }
    );
  }

  async collectionUp(collectionName) {
    await this.pluginUp(collectionName, 'video');
    await this.pluginUp(collectionName, 'interactive-media');
    await this.pluginUp(collectionName, 'media-slideshow');
    await this.pluginUp(collectionName, 'multitrack-media');
    await this.pluginUp(collectionName, 'media-analysis');
  }

  async collectionDown(collectionName) {
    await this.pluginDown(collectionName, 'video');
    await this.pluginDown(collectionName, 'interactive-media');
    await this.pluginDown(collectionName, 'media-slideshow');
    await this.pluginDown(collectionName, 'multitrack-media');
    await this.pluginDown(collectionName, 'media-analysis');
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
