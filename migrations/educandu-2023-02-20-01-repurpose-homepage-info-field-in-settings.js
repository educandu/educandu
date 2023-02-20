export default class Educandu_2023_02_20_01_repurpose_homepage_info_field_in_settings {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('settings').deleteOne({ _id: 'homepageInfo' });
    await this.db.collection('settings').insertOne({ _id: 'announcement', value: { text: '', type: 'info' } });
  }

  async down() {
    await this.db.collection('settings').deleteOne({ _id: 'announcement' });
    await this.db.collection('settings').insertOne({ _id: 'homepageInfo', value: '' });
  }
}
