import superagent from 'superagent';

class HttpClient {
  get(...args) {
    return superagent.get(...args);
  }

  put(...args) {
    return superagent.put(...args);
  }

  post(...args) {
    return superagent.post(...args);
  }

  delete(...args) {
    return superagent.delete(...args);
  }
}

export default HttpClient;
