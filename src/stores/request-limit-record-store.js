import Database from './database.js';

class RequestLimitRecordStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.requestLimitRecords;
  }

  _createId({ requestKey, ipAddress }) {
    return `${requestKey}|${ipAddress}`;
  }

  getRequestLimitRecord({ requestKey, ipAddress }, { session } = {}) {
    const _id = this._createId({ requestKey, ipAddress });
    return this.collection.findOne({ _id }, { session });
  }

  deleteRequestLimitRecord({ requestKey, ipAddress }, { session } = {}) {
    const _id = this._createId({ requestKey, ipAddress });
    return this.collection.deleteOne({ _id }, { session });
  }

  async createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert }, { session } = {}) {
    const filter = {
      _id: this._createId({ requestKey, ipAddress })
    };

    const update = {
      $inc: { count: 1 },
      $setOnInsert: { expiresOn: setExpiresOnOnInsert }
    };

    const options = {
      session,
      upsert: true,
      returnDocument: 'after'
    };

    const { value } = await this.collection.findOneAndUpdate(filter, update, options);
    return value;
  }
}

export default RequestLimitRecordStore;
