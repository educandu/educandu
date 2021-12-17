// eslint-disable-next-line camelcase
export default class Educandu_2021_12_16_01_delete_namspaces {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').dropIndex('_idx_namespace_slug_');
    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_slug_',
        key: { slug: 1 }
      }
    ]);

    await this.db.collection('documents').updateMany({}, [{ $unset: 'namespace' }]);
    await this.db.collection('documentRevisions').updateMany({}, [{ $unset: 'namespace' }]);
  }

  down() {
    throw new Error('No down provided');
  }
}
