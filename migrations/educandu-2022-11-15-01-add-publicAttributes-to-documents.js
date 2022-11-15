/* eslint-disable camelcase, no-console */
export default class Educandu_2022_11_15_01_add_publicAttributes_to_documents {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    await this.db.collection(collectionName).updateMany(
      { roomId: null },
      [
        {
          $set: {
            'publicAttributes.archived': '$archived',
            'publicAttributes.verified': '$verified',
            'publicAttributes.review': '$review',
            'publicAttributes.allowedOpenContribution': '$allowedOpenContribution'
          }
        }
      ]
    );
    await this.db.collection(collectionName).updateMany(
      { roomId: { $ne: null } },
      { $set: { publicAttributes: null } }
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
            archived: '$publicAttributes.archived',
            verified: '$publicAttributes.verified',
            review: '$publicAttributes.review',
            allowedOpenContribution: '$publicAttributes.allowedOpenContribution'
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
          publicAttributes: null
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
