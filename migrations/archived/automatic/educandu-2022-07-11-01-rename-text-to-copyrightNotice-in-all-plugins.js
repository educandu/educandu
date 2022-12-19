const pluginTypes = ['abc-notation', 'anavis', 'audio', 'ear-training', 'image', 'interactive-media', 'video'];

export default class Educandu_2022_07_11_01_rename_text_to_copyrightNotice_in_all_plugins {
  constructor(db) {
    this.db = db;
  }

  async updateColection(collectionName, newProperty, oldProperty) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': { $in: pluginTypes } }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.content) {

          switch (section.type) {
            case 'anavis':
              section.content.media[newProperty] = section.content.media[oldProperty];
              delete section.content.media[oldProperty];
              break;
            case 'ear-training':
              (section.content.tests || []).forEach(test => {
                if (test.questionImage) {
                  test.questionImage[newProperty] = test.questionImage[oldProperty];
                  delete test.questionImage[oldProperty];
                }
                if (test.answerImage) {
                  test.answerImage[newProperty] = test.answerImage[oldProperty];
                  delete test.answerImage[oldProperty];
                }
                if (test.sound) {
                  test.sound[newProperty] = test.sound[oldProperty];
                  delete test.sound[oldProperty];
                }
              });
              break;
            case 'image':
              section.content[newProperty] = section.content[oldProperty];
              delete section.content[oldProperty];
              if (section.content.effect) {
                section.content.effect[newProperty] = section.content.effect[oldProperty];
                delete section.content.effect[oldProperty];
              }
              break;
            case 'abc-notation':
            case 'audio':
            case 'interactive-media':
            case 'video':
              section.content[newProperty] = section.content[oldProperty];
              delete section.content[oldProperty];
              break;
            default:
              break;
          }

          docWasUpdated = true;
          console.log(`Updating ${collectionName} ${doc._id} - section ${section.key}`);
        }
      }
      if (docWasUpdated) {
        updateCount += 1;
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }

    return updateCount;
  }

  collectionUp(collectionName) {
    return this.updateColection(collectionName, 'copyrightNotice', 'text');
  }

  collectionDown(collectionName) {
    return this.updateColection(collectionName, 'text', 'copyrightNotice');
  }

  async up() {
    const lessonsCount = await this.collectionUp('lessons');
    const documentsCount = await this.collectionUp('documents');
    const documentRevisionsCount = await this.collectionUp('documentRevisions');

    console.log(`Updated ${lessonsCount} lessons, ${documentsCount} documents, ${documentRevisionsCount} documentRevisions`);
  }

  async down() {
    const lessonsCount = await this.collectionDown('lessons');
    const documentsCount = await this.collectionDown('documents');
    const documentRevisionsCount = await this.collectionDown('documentRevisions');

    console.log(`Updated ${lessonsCount} lessons, ${documentsCount} documents, ${documentRevisionsCount} documentRevisions`);
  }
}
