/* eslint-disable camelcase */

export default class Educandu_2022_07_29_02_drop_lessons_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('lessons').drop();
  }

  down() {
    throw new Error('Not implemented');
  }
}
