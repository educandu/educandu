/* eslint-disable camelcase, no-console, no-await-in-loop */

export default class Educandu_2022_09_29_01_migrate_tracks_volumes_to_volume_presets {
  constructor(db) {
    this.db = db;
  }

  sectionUp(section, language) {
    if (section.content) {
      section.content.volumePresets = [
        {
          name: language === 'de' ? 'Standard' : 'Default',
          mainTrack: section.content.mainTrack.volume,
          secondaryTracks: section.content.secondaryTracks.map(track => track.volume)
        }
      ];

      delete section.content.mainTrack.volume;
      section.content.secondaryTracks.forEach(track => {
        delete track.volume;
      });
    }

    return section;
  }

  sectionDown(section) {
    if (section.content) {
      section.content.mainTrack.volume = section.content.volumePresets[0].mainTrack;
      section.content.secondaryTracks.forEach((track, index) => {
        track.volume = section.content.volumePresets[0].secondaryTracks[index];
      });

      delete section.content.volumePresets;
    }

    return section;
  }

  async processCollection(collectionName, sectionType, sectionHandler) {
    const docsToUpdate = await this.db.collection(collectionName).find({ 'sections.type': sectionType }).toArray();

    for (const doc of docsToUpdate) {
      console.log(`Updating '${sectionType}' sections in ${collectionName} ${doc._id}`);
      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, {
        ...doc,
        sections: doc.sections.map(section => section.type === sectionType ? sectionHandler(section, doc.languge) : section)
      });
    }

    return docsToUpdate.length;
  }

  async up() {
    const sectionHandler = (section, language) => this.sectionUp(section, language);

    const documentsCount1 = await this.processCollection('documents', 'media-analysis', sectionHandler);
    const documentRevisionsCount1 = await this.processCollection('documentRevisions', 'media-analysis', sectionHandler);

    const documentsCount2 = await this.processCollection('documents', 'multitrack-media', sectionHandler);
    const documentRevisionsCount2 = await this.processCollection('documentRevisions', 'multitrack-media', sectionHandler);

    console.log(`Updated ${documentsCount1 + documentsCount2} documents and ${documentRevisionsCount1 + documentRevisionsCount2} documentRevisions`);
  }

  async down() {
    const sectionHandler = section => this.sectionDown(section);

    const documentsCount1 = await this.processCollection('documents', 'media-analysis', sectionHandler);
    const documentRevisionsCount1 = await this.processCollection('documentRevisions', 'media-analysis', sectionHandler);

    const documentsCount2 = await this.processCollection('documents', 'multitrack-media', sectionHandler);
    const documentRevisionsCount2 = await this.processCollection('documentRevisions', 'multitrack-media', sectionHandler);

    console.log(`Updated ${documentsCount1 + documentsCount2} documents and ${documentRevisionsCount1 + documentRevisionsCount2} documentRevisions`);

  }
}
