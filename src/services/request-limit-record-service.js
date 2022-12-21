import RequestLimitRecordStore from '../stores/request-limit-record-store.js';

export default class RequestLimitRecordService {
  static get inject() {
    return [RequestLimitRecordStore];
  }

  constructor(requestLimitRecordStore) {
    this.requestLimitRecordStore = requestLimitRecordStore;
  }

  async getCount({ req }) {
    const record = await this.requestLimitRecordStore.getRequestLimitRecord({
      requestKey: req.path,
      ipAddress: req.ip
    });
    return record?.count || 0;
  }

  async incrementCount({ req, expiresInMs }) {
    const record = await this.requestLimitRecordStore.incrementCount({
      requestKey: req.path,
      ipAddress: req.ip,
      expiresInMs,
      resetExpiresOnUpdate: false
    });
    return record.count;
  }

  async resetCount({ req }) {
    await this.requestLimitRecordStore.deleteRequestLimitRecord({
      requestKey: req.path,
      ipAddress: req.ip
    });
  }
}
