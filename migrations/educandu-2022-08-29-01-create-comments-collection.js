// eslint-disable-next-line camelcase
export default class Educandu_2022_08_29_01_create_comments_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('comments');

    await this.db.collection('comments').createIndexes([
      {
        name: '_idx_documentId_',
        key: { documentId: 1 }
      },
      {
        name: '_idx_documentId_deletedOn_',
        key: { documentId: 1, deletedOn: 1 },
        partialFilterExpression: { $and: [{ documentId: { $type: 'string' } }, { deletedOn: null }] }
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('comments');
  }
}
