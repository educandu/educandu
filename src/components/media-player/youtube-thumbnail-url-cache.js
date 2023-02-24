import Logger from '../../common/logger.js';
import { isBrowser } from '../../ui/browser-helper.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../../common/di.js';
import { analyzeMediaUrl, verifyMediaThumbnailUrl } from '../../utils/media-utils.js';

const logger = new Logger(import.meta.url);
const MIN_WIDTH_HIGH_RESOLUTION_THUMBNAIL = 500;

class YoutubeThumbnailUrlCache {
  constructor() {
    this._isDisposed = false;
    this._entries = new Map();
    this._subscribers = new Set();
  }

  getEntry(sourceUrl) {
    this._throwIfDisposed();
    let entry = this._entries.get(sourceUrl);
    if (!entry) {
      const { youtubeVideoId } = analyzeMediaUrl(sourceUrl);
      if (youtubeVideoId) {
        const lowResUrl = `https://i.ytimg.com/vi/${encodeURIComponent(youtubeVideoId)}/hqdefault.jpg`;
        const highResUrl = `https://i.ytimg.com/vi/${encodeURIComponent(youtubeVideoId)}/maxresdefault.jpg`;
        entry = this._createUnverifiedYoutubeEntry(sourceUrl, youtubeVideoId, lowResUrl, highResUrl);
        this._entries.set(sourceUrl, entry);
        this._tryVerifyHighResThumbnailUrl(entry);
      } else {
        entry = null;
      }
    }

    return entry;
  }

  subscribe(callback) {
    this._throwIfDisposed();
    this._subscribers.add(callback);
  }

  unsubscribe(callback) {
    this._throwIfDisposed();
    this._subscribers.delete(callback);
  }

  _createUnverifiedYoutubeEntry(sourceUrl, videoId, lowResThumbnailUrl, highResThumbnailUrl) {
    return {
      sourceUrl,
      videoId,
      lowResThumbnailUrl,
      highResThumbnailUrl,
      isHighResThumbnailUrlVerfied: false
    };
  }

  async _tryVerifyHighResThumbnailUrl(entry) {
    if (!isBrowser()) {
      return;
    }

    try {
      const success = await verifyMediaThumbnailUrl(entry.highResThumbnailUrl, MIN_WIDTH_HIGH_RESOLUTION_THUMBNAIL);
      if (success) {
        this._handleVerificationSuccess(entry, success);
      }
    } catch (error) {
      logger.error(error);
    }
  }

  _handleVerificationSuccess(entry) {
    if (!this._isDisposed) {
      const newEntry = { ...entry, isHighResThumbnailUrlVerfied: true };
      this._entries.set(newEntry.sourceUrl, newEntry);
      this._notifySubscribers();
    }
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

export default YoutubeThumbnailUrlCache;
