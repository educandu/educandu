import Logger from '../../common/logger.js';
import { isBrowser } from '../../ui/browser-helper.js';
import { AudioContext } from 'standardized-audio-context';
import { DISPOSAL_PRIORITY, getDisposalInfo } from '../../common/di.js';

const logger = new Logger(import.meta.url);

class RunningAudioContextCache {
  constructor() {
    this._isDisposed = false;
    this._entries = new Map();
    this._subscribers = new Set();
    this._audioContext = null;
    this._autoResumeHandler = null;
    this.value = [this._audioContext, () => this.resume()];
    this._setupAutoResume();
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

  async resume() {
    this._throwIfDisposed();
    if (!this._audioContext && isBrowser()) {
      const ctx = new AudioContext();
      await ctx.resume();
      this._audioContext = ctx;

      if (this._audioContext.state !== 'running') {
        this._audioContext.close();
        this._audioContext = null;
        throw new Error('AudioContext has to be resumed during a user interaction');
      }

      const listener = () => {
        if (this._audioContext.state !== 'running') {
          this._audioContext.removeEventListener('statechange', listener);
          this._audioContext.close();
          this._audioContext = null;
          this._updateValue();
          this._notifySubscribers();
        }
      };

      this._audioContext.addEventListener('statechange', listener);
      this._updateValue();
      this._notifySubscribers();
    }
  }

  _updateValue() {
    this.value = [this._audioContext, () => this.resume()];
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

  _setupAutoResume() {
    if (!this._autoResumeHandler && isBrowser()) {
      this._autoResumeHandler = async () => {
        await this.resume();
        this._tearDownAutoResume();
      };
      window.addEventListener('click', this._autoResumeHandler);
      window.addEventListener('keydown', this._autoResumeHandler);
    }
  }

  _tearDownAutoResume() {
    if (this._autoResumeHandler && isBrowser()) {
      window.removeEventListener('click', this._autoResumeHandler);
      window.removeEventListener('keydown', this._autoResumeHandler);
      this._autoResumeHandler = null;
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

export default RunningAudioContextCache;
