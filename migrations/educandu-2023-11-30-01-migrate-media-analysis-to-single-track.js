export default class Educandu_2023_11_30_01_migrate_media_analysis_to_single_track {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const documents = await this.db.collection(collectionName)
      .find({ 'sections.type': 'media-analysis' })
      .toArray();

    let count = 0;

    for (const doc of documents) {
      const sectionsToProcess = doc.sections
        .filter(section => section.type === 'media-analysis' && !!section.content);

      if (sectionsToProcess.length) {
        count += 1;

        sectionsToProcess.forEach(section => {
          const mainTrack = section.content.tracks[0];
          section.content.sourceUrl = mainTrack.sourceUrl;
          section.content.copyrightNotice = mainTrack.copyrightNotice;
          section.content.playbackRange = mainTrack.playbackRange;

          delete section.content.tracks;
          delete section.content.volumePresets;
        });

        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
        console.log(`Updated ${collectionName} record with _id ${doc._id}.`);
      }
    }

    return count;
  }

  async collectionDown(collectionName) {
    const documents = await this.db.collection(collectionName)
      .find({ 'sections.type': 'media-analysis' })
      .toArray();

    let count = 0;

    for (const doc of documents) {
      const sectionsToProcess = doc.sections
        .filter(section => section.type === 'media-analysis' && !!section.content);

      if (sectionsToProcess.length) {
        count += 1;

        sectionsToProcess.forEach(section => {
          section.content.tracks = [
            {
              sourceUrl: section.content.sourceUrl,
              copyrightNotice: section.content.copyrightNotice,
              playbackRange: section.content.playbackRange
            }
          ];
          section.content.volumePresets = [
            {
              name: 'default',
              tracks: [1]
            }
          ];

          delete section.content.sourceUrl;
          delete section.content.copyrightNotice;
          delete section.content.playbackRange;
        });

        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
        console.log(`Updated ${collectionName} record with _id ${doc._id}.`);
      }
    }

    return count;
  }

  async up() {
    const updatedDocumentsCount = await this.collectionUp('documents');
    console.log(`Updated ${updatedDocumentsCount} documents.`);

    const updatedDocumentRevisionsCount = await this.collectionUp('documentRevisions');
    console.log(`Updated ${updatedDocumentRevisionsCount} documentRevisions.`);
  }

  async down() {
    const updatedDocumentsCount = await this.collectionDown('documents');
    console.log(`Updated ${updatedDocumentsCount} documents.`);

    const updatedDocumentRevisionsCount = await this.collectionDown('documentRevisions');
    console.log(`Updated ${updatedDocumentRevisionsCount} documentRevisions.`);
  }
}
