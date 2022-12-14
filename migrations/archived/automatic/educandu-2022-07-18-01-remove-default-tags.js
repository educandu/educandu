export default class Educandu_2022_07_18_01_remove_default_tags {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('settings').deleteOne({ _id: 'defaultTags' });
  }

  async down() {
    await this.db.collection('settings').insertOne({
      _id: 'defaultTags',
      value: [
        'Musikhochschule',
        'Schule',
        'Musikschule',
        'Gehörbildung'
      ]
    });
  }
}
