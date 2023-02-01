const targetedPluginTypes = ['multitrack-media', 'media-analysis'];

export default class Educandu_2023_01_20_01_correct_volume_presets_in_multitrack_data {
  constructor(db) {
    this.db = db;
  }

  tryProcessSectionContent(content) {
    const correctionIsNeeded = content.volumePresets.some(preset => preset.secondaryTracks.length !== content.secondaryTracks.length);

    if (!correctionIsNeeded) {
      return false;
    }

    content.volumePresets.forEach(preset => {
      if (preset.secondaryTracks.length < content.secondaryTracks.length) {
        preset.secondaryTracks = [
          ...preset.secondaryTracks,
          ...Array.from({ length: content.secondaryTracks.length - preset.secondaryTracks.length }, () => 1)
        ];
      } else {
        preset.secondaryTracks = preset.secondaryTracks.slice(0, content.secondaryTracks.length);
      }
    });

    return true;
  }

  async processCollection(collectionName) {
    const docsToUpdate = await this.db.collection(collectionName)
      .find({ 'sections.type': { $in: targetedPluginTypes } })
      .toArray();

    let updateCount = 0;

    for (const doc of docsToUpdate) {
      let docWasUpdated = false;

      for (const section of doc.sections) {
        if (targetedPluginTypes.includes(section.type) && section.content) {
          const sectionWasProcessed = this.tryProcessSectionContent(section.content);
          if (sectionWasProcessed) {
            docWasUpdated = sectionWasProcessed;
            console.log(`Updating ${collectionName} ${doc._id} - section ${section.key}`);
          }
        }
      }
      if (docWasUpdated) {
        updateCount += 1;
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }

    return updateCount;
  }

  async up() {
    const documentsCount = await this.processCollection('documents');
    const documentRevisionsCount = await this.processCollection('documentRevisions');

    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }

  down() {
    throw Error('Not supported');
  }
}
