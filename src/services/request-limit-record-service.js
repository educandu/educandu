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
    const setExpiresOnOnInsert = new Date(Date.now() + expiresInMs);
    const record = await this.requestLimitRecordStore.createOrUpdateRequestLimitRecord({
      requestKey: req.path,
      ipAddress: req.ip,
      setExpiresOnOnInsert
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
