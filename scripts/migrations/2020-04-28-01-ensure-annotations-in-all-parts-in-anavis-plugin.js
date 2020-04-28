const { updateAll } = require('./helpers');
const Database = require('../../src/stores/database');

class Migration2020042801 {
  static get inject() { return [Database]; }

  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.sections, { type: 'anavis' }, doc => {
      Object.values(doc.content).forEach(val => {
        val.parts.forEach(part => {
          part.annotations = part.annotations || [];
        });
      });
    });
  }

  async down() {
    await Promise.resolve();
  }
}

module.exports = Migration2020042801;
