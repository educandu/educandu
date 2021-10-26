import { updateAll } from './helpers.js';

class Migration2020042801 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.collection('sections'), { type: 'anavis' }, doc => {
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
