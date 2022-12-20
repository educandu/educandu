import Logger from '../common/logger.js';
import { createShortHash } from '../utils/string-utils.js';
import RequestLimitRecordStore from '../stores/request-limit-record-store.js';

const logger = new Logger(import.meta.url);

const FAILED_LOGIN_ATTEMPTS_THRESHOLD = 5;
const FAILED_LOGIN_ATTEMPTS_KEY = 'failed-login-attempts';
const FAILED_LOGIN_ATTEMPTS_TIME_WINDOW_IN_MS = 15 * 60 * 1000;

export default class RequestLimitRecordService {
  static get inject() {
    return [RequestLimitRecordStore];
  }

  constructor(requestLimitRecordStore) {
    this.requestLimitRecordStore = requestLimitRecordStore;
  }

  getRoomById(roomId) {
    return this.roomStore.getRoomById(roomId);
  }

  async isFailedLoginRequestLimitReached(req) {
    const record = await this.requestLimitRecordStore.getRequestLimitRecord({
      requestKey: FAILED_LOGIN_ATTEMPTS_KEY,
      ipAddress: req.ip
    });

    return !!record && record.count >= FAILED_LOGIN_ATTEMPTS_THRESHOLD;
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
