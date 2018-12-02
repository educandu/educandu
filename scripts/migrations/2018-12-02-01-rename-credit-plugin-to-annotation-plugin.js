const { updateAll } = require('./helpers');
const Database = require('../../src/stores/database');

class Migration2018120201 {
  static get inject() { return [Database]; }

  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.sections, { type: 'credit' }, doc => {
      doc.type = 'annotation';
      Object.values(doc.content).forEach(val => {
        val.title = 'Credits';
      });
    });
  }

  async down() {
    await updateAll(this.db.sections, { type: 'annotation' }, doc => {
      doc.type = 'credit';
      Object.values(doc.content).forEach(val => {
        delete val.title;
      });
    });
  }
}

module.exports = Migration2018120201;
