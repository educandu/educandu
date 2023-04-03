export default class Educandu_2023_03_15_01_delete_orphaned_comments {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const orphanedComments = await this.db.collection('comments')
      .aggregate([
        { $lookup: { from: 'documents', localField: 'documentId', foreignField: '_id', as: 'documents' } },
        { $match: { documents: { $size: 0 } } },
        { $project: { _id: 1 } }
      ])
      .toArray();

    if (orphanedComments.length) {
      console.log(`Deleting ${orphanedComments.length} orphaned comments`);
      await this.db.collection('comments').deleteMany({ _id: { $in: orphanedComments.map(comment => comment._id) } });
    }
  }

  down() {
    throw new Error('Not supported');
  }
}
