/* eslint-disable camelcase, no-await-in-loop, max-depth, no-console */
export default class Educandu_2022_05_10_01_convert_audio_only_video_sections_to_audio_sections {
  constructor(db) {
    this.db = db;
  }

  async updateDocumentsAndRevisions() {
    const documentsToUpdate = await this.db.collection('documents')
      .find({ $and: [
        { 'sections.type': 'video' },
        { 'sections.content.showVideo': false }
      ] })
      .toArray();

    for (const doc of documentsToUpdate) {
      for (const docSection of doc.sections) {
        if (docSection.type === 'video' && docSection?.content.showVideo === false) {
          console.log(`Updating document ${doc._id} - section ${docSection.key}`);

          const sectionKeyToUpdate = docSection.key;

          const revisionsToUpdate = await this.db.collection('documentRevisions')
            .find({ $and: [{ key: doc._id }, { 'sections.key': sectionKeyToUpdate }] })
            .toArray();

          for (const rev of revisionsToUpdate) {
            for (const revSection of rev.sections) {
              if (revSection.key === sectionKeyToUpdate) {
                revSection.type = 'audio';
                if (revSection.content) {
                  delete revSection.content.width;
                  delete revSection.content.showVideo;
                  delete revSection.content.aspectRatio;
                  delete revSection.content.posterImage;
                }
                console.log(`Updating documentRevision ${rev._id} - section ${revSection.key}`);
              }
            }
            await this.db.collection('documentRevisions').replaceOne({ _id: rev._id }, rev);
          }

          docSection.type = 'audio';
          delete docSection.content.width;
          delete docSection.content.showVideo;
          delete docSection.content.aspectRatio;
          delete docSection.content.posterImage;
        }
      }
      await this.db.collection('documents').replaceOne({ _id: doc._id }, doc);
    }
  }

  async updateLessons() {
    const lessonsToUpdate = await this.db.collection('lessons')
      .find({
        $and: [
          { 'sections.type': 'video' },
          { 'sections.content.showVideo': false }
        ]
      })
      .toArray();

    for (const lesson of lessonsToUpdate) {
      for (const lessonSection of lesson.sections) {
        if (lessonSection.type === 'video' && lessonSection?.content.showVideo === false) {
          console.log(`Updating lesson ${lesson._id} - section ${lessonSection.key}`);

          lessonSection.type = 'audio';
          delete lessonSection.content.width;
          delete lessonSection.content.showVideo;
          delete lessonSection.content.aspectRatio;
          delete lessonSection.content.posterImage;
        }
      }
      await this.db.collection('lessons').replaceOne({ _id: lesson._id }, lesson);
    }
  }

  async up() {
    await this.updateLessons();
    await this.updateDocumentsAndRevisions();
  }

  down() {
    throw new Error('Not implemented');
  }
}
