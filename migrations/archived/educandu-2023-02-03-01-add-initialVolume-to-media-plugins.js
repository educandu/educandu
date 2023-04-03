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
    console.log(`Migrated ${collectionName} '${pluginName}' plugin`);
  }

  async earTrainingPluginUp(collectionName) {
    await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.tests.$[].sound.initialVolume': 1
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'ear-training',
            'sectionElement.content': { $ne: null }
          }
        ],
        multi: true
      }
    );
    console.log(`Migrated ${collectionName} 'ear-training' plugin`);
  }

  async earTrainingPluginDown(collectionName) {
    await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.tests.$[].sound.initialVolume': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'ear-training',
            'sectionElement.content': { $ne: null }
          }
        ],
        multi: true
      }
    );
    console.log(`Migrated ${collectionName} 'ear-training' plugin`);
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
    console.log(`Migrated ${collectionName} '${pluginName}' plugin`);
  }

  async collectionUp(collectionName) {
    await this.pluginUp(collectionName, 'audio');
    await this.pluginUp(collectionName, 'video');
    await this.pluginUp(collectionName, 'interactive-media');
    await this.pluginUp(collectionName, 'media-slideshow');
    await this.pluginUp(collectionName, 'multitrack-media');
    await this.pluginUp(collectionName, 'media-analysis');
    await this.earTrainingPluginUp(collectionName);
  }

  async collectionDown(collectionName) {
    await this.pluginDown(collectionName, 'audio');
    await this.pluginDown(collectionName, 'video');
    await this.pluginDown(collectionName, 'interactive-media');
    await this.pluginDown(collectionName, 'media-slideshow');
    await this.pluginDown(collectionName, 'multitrack-media');
    await this.pluginDown(collectionName, 'media-analysis');
    await this.earTrainingPluginDown(collectionName);
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
