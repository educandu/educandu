class Migration2021110501 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db
      .collection('documentRevisions')
      .updateMany({}, { $set: { archived: false } });

    await this.db
      .collection('documents')
      .updateMany({}, { $set: { archived: false } });
  }

  async down() {
    await this.db
      .collection('documentRevisions')
      .updateMany({}, { $unset: { archived: '' } });

    await this.db
      .collection('documents')
      .updateMany({}, { $unset: { archived: '' } });
  }
}

export default Migration2021110501;
