export default class Educandu_2022_11_26_01_add_publicContext_to_documents {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    await this.db.collection(collectionName).updateMany(
      { roomId: null },
      [
        {
          $set: {
            'publicContext.archived': '$archived',
            'publicContext.verified': '$verified',
            'publicContext.review': '$review',
            'publicContext.allowedOpenContribution': '$allowedOpenContribution'
          }
        }
      ]
    );
    await this.db.collection(collectionName).updateMany(
      { roomId: { $ne: null } },
      { $set: { publicContext: null } }
    );

    await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          archived: null,
          verified: null,
          review: null,
          allowedOpenContribution: null
        }
      }
    );
  }

  async collectionDown(collectionName) {
    await this.db.collection(collectionName).updateMany(
      { roomId: null },
      [
        {
          $set: {
            archived: '$publicContext.archived',
            verified: '$publicContext.verified',
            review: '$publicContext.review',
            allowedOpenContribution: '$publicContext.allowedOpenContribution'
          }
        }
      ]
    );
    await this.db.collection(collectionName).updateMany(
      { roomId: { $ne: null } },
      [
        {
          $set: {
            archived: false,
            verified: false,
            review: '',
            allowedOpenContribution: 'metadataAndContent'
          }
        }
      ]
    );
    await this.db.collection(collectionName).updateMany(
      {},
      {
        $unset: {
          publicContext: null
        }
      }
    );
  }

  async up() {
    await this.collectionUp('documentRevisions');
    await this.collectionUp('documents');
  }

  async down() {
    await this.collectionDown('documentRevisions');
    await this.collectionDown('documents');
  }
}
