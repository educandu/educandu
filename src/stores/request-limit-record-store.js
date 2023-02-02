import Database from './database.js';

class RequestLimitRecordStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.requestLimitRecords;
  }

  _createId({ requestKey, ipAddress }) {
    return `${requestKey}|${ipAddress}`;
  }

  async createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests = 1 }, { session } = {}) {
    const _id = this._createId({ requestKey, ipAddress });
    await this.collection.update(
      { _id },
      [
        {
          $set: {
            count: {
              $min: [
                { $max: [1, { $add: ['$count', 1] }] },
                maxRequests
              ]
            },
            expiresOn: setExpiresOnOnInsert
          }
        }
      ],
      {
        session,
        upsert: true
      }
    );

    const record = await this.collection.findOne({ _id });
    return record.count;
  }
}

export default RequestLimitRecordStore;
