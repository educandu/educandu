import axios from 'axios';

class HttpClient {
  get(...args) {
    return axios.get(...args).catch(error => {
      throw error.response.data;
    });
  }

  put(...args) {
    return axios.put(...args).catch(error => {
      throw error.response.data;
    });
  }

  post(...args) {
    return axios.post(...args).catch(error => {
      throw error.response.data;
    });
  }

  patch(...args) {
    return axios.patch(...args).catch(error => {
      throw error.response.data;
    });
  }

  delete(...args) {
    return axios.delete(...args).catch(error => {
      throw error.response.data;
    });
  }
}

export default HttpClient;
