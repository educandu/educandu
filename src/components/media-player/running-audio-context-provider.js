export default class RunningAudioContextProvider {
  constructor(cache) {
    this.cache = cache;
  }

  get value() {
    return this.cache.value[0];
  }

  resume() {
    return this.cache.value[1]();
  }

  waitForAudioContext() {
    if (this.value) {
      return Promise.resolve(this.value);
    }

    return new Promise(resolve => {
      const handler = () => {
        if (this.value) {
          this.cache.unsubscribe(handler);
          resolve(this.value);
        }
      };
      this.cache.subscribe(handler);
    });
  }
}
