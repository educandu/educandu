/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_09_07_01_streamline_nulls_in_core_entities {
  constructor(db) {
    this.db = db;
  }

  async up() {
    // DocumentRevisions
    await this.db.collection('documentRevisions').updateMany({ restoredFrom: '' }, { $set: { restoredFrom: null } });
    await this.db.collection('documentRevisions').updateMany({ originUrl: '' }, { $set: { originUrl: null } });

    // Documents
    await this.db.collection('documents').updateMany({ originUrl: '' }, { $set: { originUrl: null } });

    // Users
    await this.db.collection('users').updateMany({ organization: null }, { $set: { organization: '' } });
    await this.db.collection('users').updateMany({ introduction: null }, { $set: { introduction: '' } });
  }

  down() {
    throw new Error('Not implemented');
  }
}
