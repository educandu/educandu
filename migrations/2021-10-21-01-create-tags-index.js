class Migration2021102101 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').createIndex({ tags: 1 }, { unique: false, name: 'tagsIndex' });
  }

  async down() {
    await this.db.collection('documents').dropIndex('tagsIndex');
  }
}

export default Migration2021102101;
