import Logger from '../common/logger.js';
import { createShortHash } from '../utils/string-utils.js';
import RequestLimitRecordStore from '../stores/request-limit-record-store.js';
import {
  FAILED_LOGIN_ATTEMPTS_KEY,
  FAILED_LOGIN_ATTEMPTS_LIMIT,
  FAILED_LOGIN_ATTEMPTS_TIME_WINDOW_IN_MS
} from '../domain/constants.js';

const logger = new Logger(import.meta.url);

export default class RequestLimitRecordService {
  static get inject() {
    return [RequestLimitRecordStore];
  }

  constructor(requestLimitRecordStore) {
    this.requestLimitRecordStore = requestLimitRecordStore;
  }

  async isFailedLoginRequestLimitReached(req) {
    const record = await this.requestLimitRecordStore.getRequestLimitRecord({
      requestKey: FAILED_LOGIN_ATTEMPTS_KEY,
      ipAddress: req.ip
    });

    return !!record && record.count >= FAILED_LOGIN_ATTEMPTS_LIMIT;
  }

  async incrementFailedLoginRequestCount(req) {
    logger.debug(`Incrementing failed login attempt for IP ${createShortHash(req.ip)} (hashed)`);
    return await this.requestLimitRecordStore.incrementCount({
      requestKey: FAILED_LOGIN_ATTEMPTS_KEY,
      ipAddress: req.ip,
      expiresInMs: FAILED_LOGIN_ATTEMPTS_TIME_WINDOW_IN_MS,
      resetExpiresOnUpdate: false
    });
  }

  async resetFailedLoginRequestCount(req) {
    logger.debug(`Deleting failed login attempt for IP ${createShortHash(req.ip)} (hashed)`);
    await this.requestLimitRecordStore.deleteRequestLimitRecord({
      requestKey: FAILED_LOGIN_ATTEMPTS_KEY,
      ipAddress: req.ip
    });
  }
}
