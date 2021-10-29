import { updateAll } from './helpers.js';

class Migration2021102801 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.collection('documentRevisions'), { slug: null }, revision => {
      revision.slug = '';
    });

    await updateAll(this.db.collection('documents'), { slug: null }, doc => {
      doc.slug = '';
    });
  }

  async down() {
    // No down method possible or needed
  }
}

export default Migration2021102801;
