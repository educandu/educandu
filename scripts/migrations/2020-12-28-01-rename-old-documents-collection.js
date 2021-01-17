class Migration2020122801 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').rename('documentsOld');
  }

  async down() {
    await this.db.collection('documentsOld').rename('documents');
  }
}

export default Migration2020122801;
