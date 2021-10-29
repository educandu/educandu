export default class Migration2021102901 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').dropIndex('tagsIndex');
    await this.db.collection('documents').createIndex({ tags: 1 }, { name: '_idx_tags_' });
  }

  async down() {
    await this.db.collection('documents').dropIndex('_idx_tags_');
    await this.db.collection('documents').createIndex({ tags: 1 }, { name: 'tagsIndex' });
  }
}
