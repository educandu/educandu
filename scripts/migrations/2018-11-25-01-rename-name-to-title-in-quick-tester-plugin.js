const { updateAll } = require('./helpers');
const Database = require('../../src/stores/database');

class Migration2018112501 {
  static get inject() { return [Database]; }

  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.sections, { type: 'quick-tester' }, doc => {
      Object.values(doc.content).forEach(val => {
        val.title = val.name;
        delete val.name;
      });
    });
  }

  async down() {
    await updateAll(this.db.sections, { type: 'quick-tester' }, doc => {
      Object.values(doc.content).forEach(val => {
        val.name = val.title;
        delete val.title;
      });
    });
  }
}

module.exports = Migration2018112501;
