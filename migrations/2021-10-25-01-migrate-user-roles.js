class Migration2021102501 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({ roles: 'super-user' }, { $set: { roles: ['user', 'admin'] } });
    await this.db.collection('users').updateMany({ $or: [{ roles: 'editor' }, { roles: 'super-editor' }] }, { $set: { roles: ['user'] } });
  }

  async down() {
    await this.db.collection('users').updateMany({ roles: 'admin' }, { $set: { roles: ['user', 'super-user'] } });
  }
}

export default Migration2021102501;
