// eslint-disable-next-line camelcase
export default class Educandu_2022_02_02_01_migrate_empty_doc_titles {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany(
      { $and: [{ title: '' }, { language: 'de' }] },
      { $set: { title: '[Ohne Titel]' } }
    );
    await this.db.collection('documentRevisions').updateMany(
      { $and: [{ title: '' }, { language: { $ne: 'de' } }] },
      { $set: { title: '[Untitled]' } }
    );
    await this.db.collection('documents').updateMany(
      { $and: [{ title: '' }, { language: 'de' }] },
      { $set: { title: '[Ohne Titel]' } }
    );
    await this.db.collection('documents').updateMany(
      { $and: [{ title: '' }, { language: { $ne: 'de' } }] },
      { $set: { title: '[Untitled]' } }
    );
  }

  async down() {}
}
