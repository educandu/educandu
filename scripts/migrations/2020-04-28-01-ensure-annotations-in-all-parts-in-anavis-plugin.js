import { updateAll } from './helpers';
import Database from '../../src/stores/database';

class Migration2020042801 {
  static get inject() { return [Database]; }

  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.sections, { type: 'anavis' }, doc => {
      Object.values(doc.content || {}).forEach(val => {
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

export default Migration2020042801;
