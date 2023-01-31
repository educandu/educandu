export default class Educandu_2022_10_20_02_change_CDN_path_into_portable_URLs {
  constructor(db) {
    this.db = db;
  }

  getPortableUrl(url = '') {
    return url.startsWith('rooms/') || url.startsWith('media/')
      ? `cdn://${url}`
      : url;
  }

  async processCollection(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ cdnResources: { $exists: true, $ne: [] } }).toArray();

    for (const doc of toUpdate) {
      for (const section of doc.sections) {
        if (section.content) {
          if (section.type === 'audio') {
            section.content.sourceUrl = this.getPortableUrl(section.content.sourceUrl);
          }
          if (section.type === 'video') {
            section.content.sourceUrl = this.getPortableUrl(section.content.sourceUrl);
            section.content.posterImage.sourceUrl = this.getPortableUrl(section.content.posterImage.sourceUrl);
          }
          if (section.type === 'ear-training') {
            section.content.tests.forEach(test => {
              test.sound.sourceUrl = this.getPortableUrl(test.sound.sourceUrl);
              test.questionImage.sourceUrl = this.getPortableUrl(test.questionImage.sourceUrl);
              test.answerImage.sourceUrl = this.getPortableUrl(test.answerImage.sourceUrl);
            });
          }
          if (section.type === 'image') {
            section.content.sourceUrl = this.getPortableUrl(section.content.sourceUrl);
            section.content.hoverEffect.sourceUrl = this.getPortableUrl(section.content.hoverEffect.sourceUrl);
            section.content.revealEffect.sourceUrl = this.getPortableUrl(section.content.revealEffect.sourceUrl);
          }
          if (section.type === 'pdf-viewer') {
            section.content.sourceUrl = this.getPortableUrl(section.content.sourceUrl);
          }
          if (section.type === 'music-xml-viewer') {
            section.content.sourceUrl = this.getPortableUrl(section.content.sourceUrl);
          }
          if (section.type === 'interactive-media') {
            section.content.sourceUrl = this.getPortableUrl(section.content.sourceUrl);
          }
          if (section.type === 'media-analysis') {
            section.content.mainTrack.sourceUrl = this.getPortableUrl(section.content.mainTrack.sourceUrl);
            section.content.secondaryTracks.forEach(track => {
              track.sourceUrl = this.getPortableUrl(track.sourceUrl);
            });
          }
          if (section.type === 'multitrack-media') {
            section.content.mainTrack.sourceUrl = this.getPortableUrl(section.content.mainTrack.sourceUrl);
            section.content.secondaryTracks.forEach(track => {
              track.sourceUrl = this.getPortableUrl(track.sourceUrl);
            });
          }
          if (section.type === 'media-slideshow') {
            section.content.sourceUrl = this.getPortableUrl(section.content.sourceUrl);
            section.content.chapters.forEach(chapter => {
              chapter.image.sourceUrl = this.getPortableUrl(chapter.image.sourceUrl);
            });
          }
          if (section.type === 'audio-waveform') {
            section.content.sourceUrl = this.getPortableUrl(section.content.sourceUrl);
          }
          if (section.type === 'catalog') {
            section.content.items.forEach(item => {
              item.image.sourceUrl = this.getPortableUrl(item.image.sourceUrl);
            });
          }
        }
      }
      doc.cdnResources = doc.cdnResources.map(this.getPortableUrl);
      console.log(`Migrating ${collectionName} ${doc._id}`);
      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
    }
  }

  async up() {
    await this.processCollection('documents');
    await this.processCollection('documentRevisions');
  }

  down() {
    throw Error('Not supported');
  }
}
