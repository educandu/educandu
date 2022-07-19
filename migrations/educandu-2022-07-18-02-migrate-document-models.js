/* eslint-disable camelcase */

export default class Educandu_2022_07_18_02_migrate_documents_models {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const props = {
      roomId: '',
      dueOn: null,
      access: 'public'
    };
    await this.db.collection('documentRevisions').updateMany({}, { $set: { ...props } });
    await this.db.collection('documents').updateMany({}, { $set: { ...props } });

    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_roomId_',
        key: { roomId: 1 }
      },
      {
        name: '_idx_access_',
        key: { access: 1 }
      },
      {
        name: '_idx_access_archived_',
        key: { access: 1, archived: 1 }
      }
    ]);

  }

  async down() {
    const props = {
      roomId: null,
      dueOn: null,
      access: null
    };
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { ...props } });
    await this.db.collection('documents').updateMany({}, { $unset: { ...props } });

    await this.db.collection('documents').dropIndex('_idx_roomId_');
    await this.db.collection('documents').dropIndex('_idx_access_');
    await this.db.collection('documents').dropIndex('_idx_access_archived_');
  }
}
