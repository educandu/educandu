export default class Educandu_2023_11_28_01_add_cdn_resources_index_to_documents_and_document_revisions {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_cdnResources_',
        key: { cdnResources: 1 }
      }
    ]);
    await this.db.collection('documentRevisions').createIndexes([
      {
        name: '_idx_cdnResources_',
        key: { cdnResources: 1 }
      }
    ]);
  }

  down() {
    throw new Error('Not supported');
  }
}
