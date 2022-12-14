export default class Educandu_2022_10_19_08_remove_sourceType_from_multitrack_media_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.mainTrack.sourceType': null,
          'sections.$[sectionElement].content.secondaryTracks.$[].sourceType': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'multitrack-media',
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
