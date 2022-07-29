/* eslint-disable camelcase, no-console, no-await-in-loop */

export default class Educandu_2022_07_14_01_remove_document_key {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').updateMany({}, { $unset: { key: null } });
    await this.db.collection('documentRevisions').updateMany({}, { $rename: { key: 'documentId' } });

    await this.db.collection('documents').dropIndex('_idx_key_');
    await this.db.collection('documentRevisions').dropIndex('_idx_key_');
    await this.db.collection('documentRevisions').dropIndex('_idx_key_order_');
    await this.db.collection('documentRevisions').createIndexes([
      {
        name: '_idx_documentId_',
        key: { documentId: 1 }
      },
      {
        name: '_idx_documentId_order_',
        key: { documentId: 1, order: 1 },
        unique: true
      }
    ]);

    await this.db.collection('settings').update({ _id: 'templateDocument' }, {
      $rename: {
        'value.documentKey': 'value.documentId'
      }
    });

    await this.db.collection('settings').update({ _id: 'termsPage' }, {
      $rename: {
        'value.en.documentKey': 'value.en.documentId',
        'value.de.documentKey': 'value.de.documentId'
      }
    });

    await this.db.collection('settings').update({ _id: 'helpPage' }, {
      $rename: {
        'value.en.documentKey': 'value.en.documentId',
        'value.de.documentKey': 'value.de.documentId'
      }
    });

    await this.db.collection('settings')
      .update(
        { $and: [{ _id: 'footerLinks' }, { 'value.en': { $exists: true } }] },
        [
          {
            $set: {
              'value.en': {
                $map: {
                  input: '$value.en',
                  in: {
                    linkTitle: '$$this.linkTitle',
                    documentId: '$$this.documentKey'
                  }
                }
              }
            }
          }
        ],
        { multi: true }
      );
    await this.db.collection('settings')
      .update(
        { $and: [{ _id: 'footerLinks' }, { 'value.de': { $exists: true } }] },
        [
          {
            $set: {
              'value.de': {
                $map: {
                  input: '$value.de',
                  in: {
                    linkTitle: '$$this.linkTitle',
                    documentId: '$$this.documentKey'
                  }
                }
              }
            }
          }
        ],
        { multi: true }
      );

    await this.db.collection('tasks').update(
      { taskType: { $in: ['document-import', 'document-regeneration'] } },
      { $rename: { 'taskParams.key': 'taskParams.documentId' } }
    );
    await this.db.collection('tasks').update(
      { taskType: { $in: ['cdn-upload-directory-creation', 'cdn-resources-consolidation'] } },
      { $rename: { 'taskParams.documentKey': 'taskParams.documentId' } }
    );

  }

  async down() {
    await this.db.collection('documents').updateMany({}, [{ $set: { key: '$_id' } }]);
    await this.db.collection('documentRevisions').updateMany({}, { $rename: { documentId: 'key' } });

    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_key_',
        key: { key: 1 }
      }
    ]);
    await this.db.collection('documentRevisions').dropIndex('_idx_documentId_');
    await this.db.collection('documentRevisions').dropIndex('_idx_documentId_order_');
    await this.db.collection('documentRevisions').createIndexes([
      {
        name: '_idx_key_',
        key: { key: 1 }
      },
      {
        name: '_idx_key_order_',
        key: { key: 1, order: 1 },
        unique: true
      }
    ]);

    await this.db.collection('settings').updateOne({ _id: 'templateDocument' }, {
      $rename: {
        'value.documentId': 'value.documentKey'
      }
    });

    await this.db.collection('settings').updateOne({ _id: 'termsPage' }, {
      $rename: {
        'value.en.documentId': 'value.en.documentKey',
        'value.de.documentId': 'value.de.documentKey'
      }
    });

    await this.db.collection('settings').updateOne({ _id: 'helpPage' }, {
      $rename: {
        'value.en.documentId': 'value.en.documentKey',
        'value.de.documentId': 'value.de.documentKey'
      }
    });

    await this.db.collection('settings')
      .updateMany(
        { $and: [{ _id: 'footerLinks' }, { 'value.en': { $exists: true } }] },
        [
          {
            $set: {
              'value.en': {
                $map: {
                  input: '$value.en',
                  in: {
                    linkTitle: '$$this.linkTitle',
                    documentKey: '$$this.documentId'
                  }
                }
              }
            }
          }
        ]
      );
    await this.db.collection('settings')
      .updateMany(
        { $and: [{ _id: 'footerLinks' }, { 'value.de': { $exists: true } }] },
        [
          {
            $set: {
              'value.de': {
                $map: {
                  input: '$value.de',
                  in: {
                    linkTitle: '$$this.linkTitle',
                    documentKey: '$$this.documentId'
                  }
                }
              }
            }
          }
        ]
      );

    await this.db.collection('tasks').updateMany(
      { taskType: { $in: ['document-import', 'document-regeneration'] } },
      { $rename: {
        'taskParams.documentId': 'taskParams.key'
      } }
    );
    await this.db.collection('tasks').updateMany(
      { taskType: { $in: ['cdn-upload-directory-creation', 'cdn-resources-consolidation'] } },
      { $rename: {
        'taskParams.documentId': 'taskParams.documentKey'
      } }
    );
  }
}
