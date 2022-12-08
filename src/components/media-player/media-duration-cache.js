import Logger from '../../common/logger.js';
import { isBrowser } from '../../ui/browser-helper.js';
import { determineMediaDuration } from '../../utils/media-utils.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../../common/di.js';

const logger = new Logger(import.meta.url);

const FAILED_ENTRIES_LIFETIME = 5000;

class MediaDurationCache {
  static get inject() { return []; }

  constructor() {
    this._isDisposed = false;
    this._entries = new Map();
    this._subscribers = new Set();
  }

  getEntry(sourceUrl) {
    this._throwIfDisposed();
    let entry = this._entries.get(sourceUrl);
    if (!entry) {
      entry = this._createUnresolvedEntry(sourceUrl);
      this._entries.set(sourceUrl, entry);
      this._determineDuration(sourceUrl);
    }

    return entry;
  }

  getEntries(sourceUrls) {
    this._throwIfDisposed();
    return sourceUrls.map(sourceUrl => this.getEntry(sourceUrl));
  }

  setEntry(sourceUrl, duration) {
    this._throwIfDisposed();
    this._handleDurationDetermined(sourceUrl, duration, null);
  }

  subscribe(callback) {
    this._throwIfDisposed();
    this._subscribers.add(callback);
  }

  unsubscribe(callback) {
    this._throwIfDisposed();
    this._subscribers.delete(callback);
  }

  _createUnresolvedEntry(sourceUrl) {
    return {
      sourceUrl,
      hasError: false,
      isResolved: false,
      duration: 0
    };
  }

  _createResolvedEntry(sourceUrl, duration, error) {
    return {
      sourceUrl,
      hasError: !!error,
      isResolved: true,
      duration: error ? 0 : duration
    };
  }

  async _determineDuration(sourceUrl) {
    if (!isBrowser()) {
      return;
    }

    try {
      const duration = await determineMediaDuration(sourceUrl);
      this._handleDurationDetermined(sourceUrl, duration, null);
    } catch (error) {
      logger.error(error);
      this._handleDurationDetermined(sourceUrl, null, error);
      this._registerForDeletion(sourceUrl);
    }
  }

  _handleDurationDetermined(sourceUrl, duration, error) {
    const newEntry = this._createResolvedEntry(sourceUrl, duration, error);
    this._entries.set(sourceUrl, newEntry);
    this._notifySubscribers();
  }

  _notifySubscribers() {
    logger.info(`Notifying ${this._subscribers.size} subscribers`);
    for (const subscriber of this._subscribers) {
      try {
        subscriber();
      } catch (error) {
        logger.error(error);
      }
    }
  }

  _registerForDeletion(sourceUrl) {
    window.setTimeout(() => {
      if (!this._isDisposed) {
        this._entries.delete(sourceUrl);
        this._notifySubscribers();
      }
    }, FAILED_ENTRIES_LIFETIME);
  }

  _throwIfDisposed() {
    if (this._isDisposed) {
      throw new Error('Cannot use a disposed instance');
    }
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.domain,
      dispose: () => {
        this._entries.clear();
        this._subscribers.clear();
        this._isDisposed = true;
      }
    };
  }
}

export default MediaDurationCache;
