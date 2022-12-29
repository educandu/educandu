import RequestLimitRecordStore from '../stores/request-limit-record-store.js';

export default class RequestLimitRecordService {
  static get inject() {
    return [RequestLimitRecordStore];
  }

  constructor(requestLimitRecordStore) {
    this.requestLimitRecordStore = requestLimitRecordStore;
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
}
