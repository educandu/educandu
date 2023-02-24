import Database from './database.js';

class RequestLimitRecordStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.requestLimitRecords;
  }

  _createId({ requestKey, ipAddress }) {
    return `${requestKey}|${ipAddress}`;
  }

  async createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests = 1 }, { session } = {}) {
    const filter = {
      _id: this._createId({ requestKey, ipAddress })
    };

    const aggregationPipeline = [
      {
        $set: {
          count: {
            $min: [
              { $max: [1, { $add: ['$count', 1] }] },
              maxRequests
            ]
          },
          expiresOn: {
            $min: ['$expiresOn', setExpiresOnOnInsert]
          }
        }
      }
    ];

    const options = {
      session,
      upsert: true,
      returnDocument: 'after'
    };

    const { value } = await this.collection.findOneAndUpdate(filter, aggregationPipeline, options);
    return value;
  }
}

export default RequestLimitRecordStore;
