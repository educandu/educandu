export default class Educandu_2022_06_27_01_change_ear_training_plugin_data_model {
  constructor(db) {
    this.db = db;
  }

  updateTest(test) {
    if (test.mode) {
      return;
    }

    test.mode = 'abcCode';
    test.questionAbcCode = test.startAbcCode;
    test.answerAbcCode = test.fullAbcCode;
    test.questionImage = null;
    test.answerImage = null;
    delete test.startAbcCode;
    delete test.fullAbcCode;
  }

  async updateDocumentsAndRevisions() {
    const documentsToUpdate = await this.db.collection('documents')
      .find({ 'sections.type': 'ear-training' })
      .toArray();

    for (const doc of documentsToUpdate) {
      for (const docSection of doc.sections) {
        if (docSection.type === 'ear-training') {
          console.log(`Updating document ${doc._id} - section ${docSection.key}`);

          const sectionKeyToUpdate = docSection.key;

          const revisionsToUpdate = await this.db.collection('documentRevisions')
            .find({ $and: [{ key: doc._id }, { 'sections.key': sectionKeyToUpdate }] })
            .toArray();

          for (const rev of revisionsToUpdate) {
            for (const revSection of rev.sections) {
              if (revSection.key === sectionKeyToUpdate && revSection.content?.tests) {
                console.log(`Updating documentRevision ${rev._id} - section ${revSection.key}`);

                for (const test of revSection.content.tests) {
                  this.updateTest(test);
                }
              }
            }
            await this.db.collection('documentRevisions').replaceOne({ _id: rev._id }, rev);
          }

          if (docSection.content?.tests) {
            for (const test of docSection.content.tests) {
              this.updateTest(test);
            }
          }
        }
      }
      await this.db.collection('documents').replaceOne({ _id: doc._id }, doc);
    }
  }

  async updateLessons() {
    const lessonsToUpdate = await this.db.collection('lessons')
      .find({ 'sections.type': 'ear-training' })
      .toArray();

    for (const lesson of lessonsToUpdate) {
      for (const lessonSection of lesson.sections) {
        if (lessonSection.type === 'ear-training' && lessonSection.content?.tests) {
          console.log(`Updating lesson ${lesson._id} - section ${lessonSection.key}`);

          for (const test of lessonSection.content.tests) {
            this.updateTest(test);
          }
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
