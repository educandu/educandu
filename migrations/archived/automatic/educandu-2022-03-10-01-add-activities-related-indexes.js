export default class Educandu_2022_03_10_01_add_activities_related_indexes {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_createdBy_',
        key: { createdBy: -1 }
      },
      {
        name: '_idx_updatedBy_',
        key: { updatedBy: -1 }
      }
    ]);
    await this.db.collection('rooms').createIndexes([
      {
        name: '_idx_created_by_',
        key: { createdBy: -1 }
      },
      {
        name: '_idx_updated_by_',
        key: { updatedBy: -1 }
      },
      {
        name: '_idx_members_user_id_desc_',
        key: { 'members.userId': -1 }
      }
    ]);
    await this.db.collection('lessons').createIndexes([
      {
        name: '_idx_created_by_',
        key: { createdBy: -1 }
      }
    ]);
  }

  async down() {
    await this.db.collection('documents').dropIndex('_idx_createdBy_');
    await this.db.collection('documents').dropIndex('_idx_updatedBy_');
    await this.db.collection('rooms').dropIndex('_idx_createdBy_');
    await this.db.collection('rooms').dropIndex('_idx_updatedBy_');
    await this.db.collection('rooms').dropIndex('_idx_members_user_id_desc_');
    await this.db.collection('lessons').dropIndex('_idx_createdBy_');
  }
}
