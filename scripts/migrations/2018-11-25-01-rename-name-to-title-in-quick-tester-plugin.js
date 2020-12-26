import { updateAll } from './helpers';
import Database from '../../src/stores/database';

class Migration2018112501 {
  static get inject() { return [Database]; }

  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.sections, { type: 'quick-tester' }, doc => {
      Object.values(doc.content || {}).forEach(val => {
        val.title = val.name;
        delete val.name;
      });
    });
  }

  async down() {
    await updateAll(this.db.sections, { type: 'quick-tester' }, doc => {
      Object.values(doc.content || {}).forEach(val => {
        val.name = val.title;
        delete val.title;
      });
    });
  }
}

export default Migration2018112501;
