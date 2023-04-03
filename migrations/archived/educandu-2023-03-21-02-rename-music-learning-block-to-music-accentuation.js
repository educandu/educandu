export default class Educandu_2023_03_21_02_rename_music_learning_block_to_music_accentuation {
  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName, oldPluginName, newPluginName) {
    const cursor = this.db.collection(collectionName).find({ 'sections.type': oldPluginName });

    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      for (const section of doc.sections) {
        if (section.type === oldPluginName) {
          section.type = newPluginName;
          count += 1;
        }
      }

      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
    }

    console.log(`Migrated ${count} '${oldPluginName}' sections in ${collectionName}`);
  }

  async up() {
    const oldPluginName = 'music-learning-block';
    const newPluginName = 'music-accentuation';

    await this.processCollection('documents', oldPluginName, newPluginName);
    await this.processCollection('documentRevisions', oldPluginName, newPluginName);
  }

  async down() {
    const oldPluginName = 'music-accentuation';
    const newPluginName = 'music-learning-block';

    await this.processCollection('documents', oldPluginName, newPluginName);
    await this.processCollection('documentRevisions', oldPluginName, newPluginName);
  }
}
