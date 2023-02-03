export default class Educandu_2023_01_30_01_delete_existing_password_reset_requests {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('passwordResetRequests').deleteMany();
  }

  down() {
    throw new Error('Not supported');
  }
}
