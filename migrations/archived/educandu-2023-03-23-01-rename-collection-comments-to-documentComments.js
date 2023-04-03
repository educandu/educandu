export default class Educandu_2023_03_23_01_rename_collection_comments_to_documentComments {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.renameCollection('comments', 'documentComments');
  }

  async down() {
    await this.db.renameCollection('documentComments', 'comments');
  }
}
