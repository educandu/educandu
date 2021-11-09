class Migration2021110901 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db
      .collection('settings')
      .updateMany(
        { _id: 'homeLanguages' },
        { $unset: { 'value.$[].searchFieldButton': false, 'value.$[].searchFieldPlaceholder': false } }
      );
  }

  async down() {
    await this.db
      .collection('settings')
      .updateMany(
        { _id: 'homeLanguages' },
        { $set: { 'value.$[].searchFieldButton': 'Search', 'value.$[].searchFieldPlaceholder': 'Search terms' } }
      );
  }
}

export default Migration2021110901;
