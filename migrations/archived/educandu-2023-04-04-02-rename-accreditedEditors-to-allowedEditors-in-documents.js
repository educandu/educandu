export default class Educandu_2023_04_04_02_rename_accreditedEditors_to_allowedEditors_in_documents {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const filterSpec = { publicContext: { $ne: null } };
    const updateSpec = { $rename: { 'publicContext.accreditedEditors': 'publicContext.allowedEditors' } };
    await this.db.collection('documentRevisions').updateMany(filterSpec, updateSpec);
    await this.db.collection('documents').updateMany(filterSpec, updateSpec);
  }

  async down() {
    const filterSpec = { publicContext: { $ne: null } };
    const updateSpec = { $rename: { 'publicContext.allowedEditors': 'publicContext.accreditedEditors' } };
    await this.db.collection('documentRevisions').updateMany(filterSpec, updateSpec);
    await this.db.collection('documents').updateMany(filterSpec, updateSpec);
  }
}
