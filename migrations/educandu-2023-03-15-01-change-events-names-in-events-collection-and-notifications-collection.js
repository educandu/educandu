export default class Educandu_2023_03_15_01_change_events_names_in_events_collection_and_notifications_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('events').updateMany({ type: 'revision-created' }, { $set: { type: 'document-revision-created' } });
    await this.db.collection('events').updateMany({ type: 'comment-created' }, { $set: { type: 'document-comment-created' } });
    await this.db.collection('notifications').updateMany({ eventType: 'revision-created' }, { $set: { eventType: 'document-revision-created' } });
    await this.db.collection('notifications').updateMany({ eventType: 'comment-created' }, { $set: { eventType: 'document-comment-created' } });
  }

  async down() {
    await this.db.collection('events').updateMany({ type: 'document-revision-created' }, { $set: { type: 'revision-created' } });
    await this.db.collection('events').updateMany({ type: 'document-comment-created' }, { $set: { type: 'comment-created' } });
    await this.db.collection('notifications').updateMany({ eventType: 'document-revision-created' }, { $set: { eventType: 'revision-created' } });
    await this.db.collection('notifications').updateMany({ eventType: 'document-comment-created' }, { $set: { eventType: 'comment-created' } });
  }
}
