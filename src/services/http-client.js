import axios from 'axios';

class HttpClient {
  get(...args) {
    return axios.get(...args);
  }

  put(...args) {
    return axios.put(...args);
  }

  post(...args) {
    return axios.post(...args);
  }

  patch(...args) {
    return axios.patch(...args);
  }

  delete(...args) {
    return axios.delete(...args);
  }
}

export default HttpClient;
