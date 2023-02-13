import uniqueId from '../src/utils/unique-id.js';

export default class Educandu_2023_02_10_03_change_data_model_for_media_analysis_plugin {
  constructor(db) {
    this.db = db;
  }

  sectionUp(section) {
    const mainTrack = section.content.mainTrack;

    section.content.tracks = [
      {
        key: uniqueId.create(),
        name: mainTrack.name,
        sourceUrl: mainTrack.sourceUrl,
        copyrightNotice: mainTrack.copyrightNotice,
        playbackRange: mainTrack.playbackRange
      },
      ...section.content.secondaryTracks.map(secondaryTrack => ({
        key: uniqueId.create(),
        name: secondaryTrack.name,
        sourceUrl: secondaryTrack.sourceUrl,
        copyrightNotice: secondaryTrack.copyrightNotice,
        playbackRange: [0, 1]
      }))
    ];

    for (const volumePreset of section.content.volumePresets) {
      volumePreset.tracks = [volumePreset.mainTrack, ...volumePreset.secondaryTracks];
      delete volumePreset.mainTrack;
      delete volumePreset.secondaryTracks;
    }

    section.content.showVideo = mainTrack.showVideo;
    section.content.aspectRatio = mainTrack.aspectRatio;
    section.content.posterImage = mainTrack.posterImage;

    delete section.content.mainTrack;
    delete section.content.secondaryTracks;

    return section;
  }

  async collectionUp(collectionName) {
    const cursor = this.db.collection(collectionName).find({ 'sections.type': 'media-analysis' });

    let counter = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      counter += 1;

      let isUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'media-analysis' && !!section.content) {
          this.sectionUp(section);
          isUpdated = true;
        }
      }

      if (isUpdated) {
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
        console.log(`Updated ${collectionName} - ${doc._id}`);
      }
    }

    console.log(`Migrated ${counter} ${collectionName}`);
  }

  async up() {
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  down() {
    throw new Error('Not supported');
  }
}
