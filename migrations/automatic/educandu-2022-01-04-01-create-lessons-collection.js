// eslint-disable-next-line camelcase
export default class Educandu_2022_01_04_01_create_lessons_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('lessons');
  }

  async down() {
    await this.db.dropCollection('lessons');
  }
}
