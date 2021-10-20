class Migration2021100701 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db
      .collection('documentRevisions')
      .updateMany({}, { $set: { restoredFrom: null } });
  }

  async down() {
    await this.db
      .collection('documentRevisions')
      .updateMany({}, { $unset: { restoredFrom: '' } });
  }
}

export default Migration2021100701;
