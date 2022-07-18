/* eslint-disable camelcase */

export default class Educandu_2022_07_18_02_migrate_documents_models {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const props = {
      roomId: '',
      dueOn: null,
      accessLevel: 'public'
    };
    await this.db.collection('documentRevisions').updateMany({}, { $set: { ...props } });
    await this.db.collection('documents').updateMany({}, { $set: { ...props } });
  }

  async down() {
    const props = {
      roomId: null,
      dueOn: null,
      accessLevel: null
    };
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { ...props } });
    await this.db.collection('documents').updateMany({}, { $unset: { ...props } });
  }
}
