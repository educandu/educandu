
const intentToColorSchemeMap = {
  neutral: 'khaki',
  confirm: 'green',
  inform: 'blue',
  warn: 'orange',
  discourage: 'red'
};

export default class Educandu_2023_03_03_01_migrate_existing_annotation_sections_to_music_learning_block {
  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName) {
    const cursor = this.db.collection(collectionName).find({ 'sections.type': 'annotation' });

    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      for (const section of doc.sections) {
        if (section.type === 'annotation') {
          count += 1;
          section.type = 'music-learning-block';
          const annotationContent = section.content;

          if (annotationContent) {
            const musicLearningBlockContent = {
              type: 'hint',
              colorScheme: intentToColorSchemeMap[annotationContent.intent],
              behavior: annotationContent.behavior,
              text: annotationContent.text,
              width: annotationContent.width
            };
            section.content = musicLearningBlockContent;
          }
        }
      }

      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
    }

    console.log(`Migrated ${count} annotation sections in ${collectionName}`);
  }

  async up() {
    await this.processCollection('documentRevisions');
    await this.processCollection('documents');
  }

  down() {
    throw new Error('Not supported');
  }
}
