export default class Educandu_2023_03_23_02_rename_commentId_to_documentCommentId_in_event_params {
  constructor(db) {
    this.db = db;
  }

  async renameKeyInCollection({ collectionName, where, from, to }) {
    await this.db.collection(collectionName).updateMany(where, { $rename: { [from]: to } });
  }

  async up() {
    await this.renameKeyInCollection({
      collectionName: 'events',
      where: { type: 'document-comment-created' },
      from: 'params.commentId',
      to: 'params.documentCommentId'
    });
    await this.renameKeyInCollection({
      collectionName: 'notifications',
      where: { eventType: 'document-comment-created' },
      from: 'eventParams.commentId',
      to: 'eventParams.documentCommentId'
    });
  }

  async down() {
    await this.renameKeyInCollection({
      collectionName: 'events',
      where: { type: 'document-comment-created' },
      from: 'params.documentCommentId',
      to: 'params.commentId'
    });
    await this.renameKeyInCollection({
      collectionName: 'notifications',
      where: { eventType: 'document-comment-created' },
      from: 'eventParams.documentCommentId',
      to: 'eventParams.commentId'
    });
  }
}
