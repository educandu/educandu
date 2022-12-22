export default class Educandu_2022_07_30_01_initial_schema {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const existingCollections = await this.db.listCollections().toArray();

    const createCollectionWithIndexes = async (collectionName, indexes) => {
      if (!existingCollections.find(collection => collection.name === collectionName)) {
        await this.db.createCollection(collectionName);
      }
      if (indexes?.length) {
        await this.db.collection(collectionName).createIndexes(indexes);
      }
    };

    await createCollectionWithIndexes('batches', []);
    await createCollectionWithIndexes('documentOrders', []);
    await createCollectionWithIndexes('documentRevisions', [
      {
        name: '_idx_documentId_',
        key: { documentId: 1 }
      },
      {
        name: '_idx_order_',
        key: { order: 1 },
        unique: true
      },
      {
        name: '_idx_documentId_order_',
        key: { documentId: 1, order: 1 },
        unique: true
      }
    ]);
    await createCollectionWithIndexes('documents', [
      {
        name: '_idx_createdBy_',
        key: { createdBy: -1 }
      },
      {
        name: '_idx_updatedBy_',
        key: { updatedBy: -1 }
      },
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
      },
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
    await createCollectionWithIndexes('locks', [
      {
        name: '_idx_type_key_',
        key: { type: 1, key: 1 },
        unique: true
      },
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
    await createCollectionWithIndexes('migrations', []);
    await createCollectionWithIndexes('passwordResetRequests', [
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
    await createCollectionWithIndexes('roomInvitations', [
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      },
      {
        name: '_idx_roomId_email_',
        key: { email: 1, roomId: 1 },
        unique: true
      },
      {
        name: '_idx_token_',
        key: { token: 1 },
        unique: true
      }
    ]);
    await createCollectionWithIndexes('rooms', [
      {
        name: '_idx_owner_',
        key: { owner: 1 }
      },
      {
        name: '_idx_created_by_',
        key: { createdBy: -1 }
      },
      {
        name: '_idx_updated_by_',
        key: { updatedBy: -1 }
      },
      {
        name: '_idx_members_user_id_',
        key: { 'members.userId': 1 }
      },
      {
        name: '_idx_members_user_id_desc_',
        key: { 'members.userId': -1 }
      }
    ]);
    await createCollectionWithIndexes('sessions', [
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
    await createCollectionWithIndexes('settings', []);
    await createCollectionWithIndexes('storagePlans', [
      {
        name: '_idx_name',
        key: { name: 1 },
        unique: true
      }
    ]);
    await createCollectionWithIndexes('tasks', [
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
    await createCollectionWithIndexes('users', [
      {
        name: '_idx_email_accountClosedOn_',
        key: { email: 1, accountClosedOn: 1 },
        unique: true,
        partialFilterExpression: { $and: [{ email: { $type: 'string' } }, { accountClosedOn: null }] }
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
  }

  async down() {
    await this.db.dropCollection('batches');
    await this.db.dropCollection('documentOrders');
    await this.db.dropCollection('documentRevisions');
    await this.db.dropCollection('documents');
    await this.db.dropCollection('locks');
    await this.db.dropCollection('migrations');
    await this.db.dropCollection('passwordResetRequests');
    await this.db.dropCollection('roomInvitations');
    await this.db.dropCollection('rooms');
    await this.db.dropCollection('sessions');
    await this.db.dropCollection('settings');
    await this.db.dropCollection('storagePlans');
    await this.db.dropCollection('tasks');
    await this.db.dropCollection('users');
  }
}
