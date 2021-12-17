// eslint-disable-next-line camelcase
export default class Educandu_2021_12_07_01_initial_schema {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('documentLocks');
    await this.db.createCollection('documentOrders');
    await this.db.createCollection('documentRevisions');
    await this.db.createCollection('documents');
    await this.db.createCollection('passwordResetRequests');
    await this.db.createCollection('sessions');
    await this.db.createCollection('settings');
    await this.db.createCollection('users');
    await this.db.createCollection('batches');
    await this.db.createCollection('batchLocks');
    await this.db.createCollection('tasks');
    await this.db.createCollection('taskLocks');

    await this.db.collection('documentRevisions').createIndexes([
      {
        name: '_idx_key_',
        key: { key: 1 }
      },
      {
        name: '_idx_order_',
        key: { order: 1 },
        unique: true
      },
      {
        name: '_idx_key_order_',
        key: { key: 1, order: 1 },
        unique: true
      }
    ]);

    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_updatedOn_',
        key: { updatedOn: -1 }
      },
      {
        name: '_idx_slug_',
        key: { slug: 1 }
      },
      {
        name: '_idx_tags_',
        key: { tags: 1 }
      }
    ]);

    await this.db.collection('sessions').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);

    await this.db.collection('users').createIndexes([
      {
        name: '_idx_username_provider_',
        key: { username: 1, provider: 1 },
        unique: true
      },
      {
        name: '_idx_email_provider_',
        key: { email: 1, provider: 1 },
        unique: true,
        partialFilterExpression: { email: { $type: 'string' } }
      },
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      },
      {
        name: '_idx_verificationCode_',
        key: { verificationCode: 1 },
        unique: true,
        partialFilterExpression: { verificationCode: { $type: 'string' } }
      },
      {
        name: '_idx_verificationCode_provider_',
        key: { verificationCode: 1, provider: 1 },
        unique: true,
        partialFilterExpression: { verificationCode: { $type: 'string' } }
      }
    ]);

    await this.db.collection('tasks').createIndexes([
      {
        name: '_idx_batch_id_',
        key: { batchId: 1 }
      },
      {
        name: '_idx_batch_id_processed_',
        key: { batchId: 1, processed: 1 }
      },
      {
        name: '_idx_task_id_processed_',
        key: { taskId: 1, processed: 1 }
      }
    ]);

    await this.db.collection('taskLocks').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('documentLocks');
    await this.db.dropCollection('documentOrders');
    await this.db.dropCollection('documentRevisions');
    await this.db.dropCollection('documents');
    await this.db.dropCollection('passwordResetRequests');
    await this.db.dropCollection('sessions');
    await this.db.dropCollection('settings');
    await this.db.dropCollection('users');
    await this.db.dropCollection('batches');
    await this.db.dropCollection('batchLocks');
    await this.db.dropCollection('tasks');
    await this.db.dropCollection('taskLocks');
  }
}
