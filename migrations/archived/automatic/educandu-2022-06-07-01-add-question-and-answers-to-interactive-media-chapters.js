export default class Educandu_2022_06_07_01_add_question_and_answers_to_interactive_media_chapters {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.chapters.$[].question': '[Question]',
          'sections.$[sectionElement].content.chapters.$[].answers': ['[Answer]'],
          'sections.$[sectionElement].content.chapters.$[].correctAnswerIndex': 0
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'interactive-media',
            'sectionElement.content': { $ne: null }
          }
        ],
        multi: true
      }
    );

    console.log(`Updated ${collectionName}: ${JSON.stringify(result)}`);
  }

  async collectionDown(collectionName) {
    const result = await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          'sections.$[sectionElement].content.chapters.$[].question': null,
          'sections.$[sectionElement].content.chapters.$[].answers': null,
          'sections.$[sectionElement].content.chapters.$[].correctAnswerIndex': null
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.type': 'interactive-media',
            'sectionElement.content': { $ne: null }
          }
        ],
        multi: true
      }
    );

    console.log(`Updated ${collectionName}: ${JSON.stringify(result)}`);
  }

  async up() {
    await this.collectionUp('lessons');
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  async down() {
    await this.collectionDown('lessons');
    await this.collectionDown('documents');
    await this.collectionDown('documentRevisions');
  }
}
