import Logger from '../common/logger.js';
import { isBrowser } from '../ui/browser-helper.js';
import ClientConfig from '../bootstrap/client-config.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../common/di.js';
import MediaLibraryApiClient from '../api-clients/media-library-api-client.js';
import { getPortableUrl, isMediaLibrarySourceType } from '../utils/source-utils.js';

const logger = new Logger(import.meta.url);

const MAX_FAILED_ATTEMPTS = 3;
const FAILED_ENTRIES_LIFETIME_IN_MS = 5000;

class MediaLibraryItemCache {
  static dependencies = [MediaLibraryApiClient, ClientConfig];

  constructor(mediaLibraryApiClient, clientConfig) {
    this._mediaLibraryApiClient = mediaLibraryApiClient;
    this._clientConfig = clientConfig;
    this._isDisposed = false;
    this._entries = new Map();
    this._subscribers = new Set();
    this._errorCountPerSourceUrl = new Map();
  }

  getEntry(sourceUrl) {
    this._throwIfDisposed();
    const canonicSourceUrl = this._canonicalizeSourceUrl(sourceUrl);
    let entry = this._entries.get(canonicSourceUrl);
    if (!entry) {
      entry = this._createUnresolvedEntry(canonicSourceUrl);
      if (!isMediaLibrarySourceType(canonicSourceUrl) || isBrowser()) {
        this._entries.set(canonicSourceUrl, entry);
        this._determineMediaLibraryItem(canonicSourceUrl);
      }
    }

    return entry;
  }

  getEntries(sourceUrls) {
    this._throwIfDisposed();
    return sourceUrls.map(sourceUrl => this.getEntry(sourceUrl));
  }

  setEntry(sourceUrl, item) {
    this._throwIfDisposed();
    const canonicSourceUrl = this._canonicalizeSourceUrl(sourceUrl);
    this._handleMediaLibraryItemDetermined(canonicSourceUrl, item, null);
  }

  subscribe(callback) {
    this._throwIfDisposed();
    if (isBrowser()) {
      this._subscribers.add(callback);
    }
  }

  unsubscribe(callback) {
    this._throwIfDisposed();
    if (isBrowser()) {
      this._subscribers.delete(callback);
    }
  }

  _canonicalizeSourceUrl(sourceUrl) {
    return getPortableUrl({ url: sourceUrl, cdnRootUrl: this._clientConfig.cdnRootUrl });
  }

  _createUnresolvedEntry(sourceUrl) {
    return {
      sourceUrl,
      hasError: false,
      isResolved: false,
      item: null
    };
  }

  _createResolvedEntry(sourceUrl, item, error) {
    return {
      sourceUrl,
      hasError: !!error,
      isResolved: true,
      item: error ? 0 : item
    };
  }

  async _determineMediaLibraryItem(sourceUrl) {
    if (!isBrowser()) {
      return;
    }

    try {
      const item = await this._mediaLibraryApiClient.findMediaLibraryItem({ url: sourceUrl });
      this._handleMediaLibraryItemDetermined(sourceUrl, item, null);
    } catch (error) {
      logger.error(error);
      this._handleMediaLibraryItemDetermined(sourceUrl, null, error);
      const newErrorCount = (this._errorCountPerSourceUrl.get(sourceUrl) || 0) + 1;
      if (newErrorCount < MAX_FAILED_ATTEMPTS) {
        this._errorCountPerSourceUrl.set(sourceUrl, newErrorCount);
        this._registerForDeletion(sourceUrl);
      } else {
        this._errorCountPerSourceUrl.set(sourceUrl, MAX_FAILED_ATTEMPTS);
      }
    }
  }

  _handleMediaLibraryItemDetermined(sourceUrl, item, error) {
    if (!this._isDisposed) {
      const newEntry = this._createResolvedEntry(sourceUrl, item, error);
      this._entries.set(sourceUrl, newEntry);
      this._notifySubscribers();
    }
  }

  _notifySubscribers() {
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
    }, FAILED_ENTRIES_LIFETIME_IN_MS);
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

export default MediaLibraryItemCache;
