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

  async incrementCount({ ipAddress, requestKey, expiresInMs, resetExpiresOnUpdate = false }, { session } = {}) {
    const expires = new Date(Date.now() + expiresInMs);

    const filter = {
      _id: this._createId({ requestKey, ipAddress })
    };

    const update = {
      $inc: { count: 1 },
      [resetExpiresOnUpdate ? '$set' : '$setOnInsert']: { expires }
    };

    const options = {
      session,
      upsert: true,
      returnDocument: 'after'
    };

    const result = await this.collection.findOneAndUpdate(filter, update, options);
    return result.value;
  }
}

export default RequestLimitRecordStore;
