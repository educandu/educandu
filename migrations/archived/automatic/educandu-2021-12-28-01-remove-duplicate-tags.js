export default class Educandu_2021_12_28_01_remove_duplicate_tags {
  constructor(db) {
    this.db = db;
  }

  async updateCollection(collection) {
    const projectionsWithoutDuplicateTags = await collection.aggregate([{ $project: { tags: { $setUnion: ['$tags', []] } } }]).toArray();
    const cursor = collection.find({});

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      const projectionWithoutDuplicateTags = projectionsWithoutDuplicateTags.find(document => document._id === doc._id);
      const tagsWithoutDuplicates = projectionWithoutDuplicateTags.tags;

      if (doc.tags.length !== tagsWithoutDuplicates.length) {
        const docType = doc.revision ? 'document' : 'documentRevision';
        console.log(`Updating tags in ${docType} '${doc._id}'`);
        console.log(`   from: [${doc.tags}]`);
        console.log(`     to: [${tagsWithoutDuplicates}]`);

        await collection.updateOne({ _id: doc._id }, { $set: { tags: tagsWithoutDuplicates } });
      }
    }
  }

  async up() {
    await this.updateCollection(this.db.collection('documents'));
    await this.updateCollection(this.db.collection('documentRevisions'));
  }

  down() {
    throw new Error('Not implemented');
  }
}
