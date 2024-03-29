import axios from 'axios';

class HttpClient {
  get(...args) {
    return axios.get(...args).catch(error => {
      throw error.response?.data || error;
    });
  }

  put(...args) {
    return axios.put(...args).catch(error => {
      throw error.response?.data || error;
    });
  }

  post(...args) {
    return axios.post(...args).catch(error => {
      throw error.response?.data || error;
    });
  }

  patch(...args) {
    return axios.patch(...args).catch(error => {
      throw error.response?.data || error;
    });
  }

  delete(...args) {
    return axios.delete(...args).catch(error => {
      throw error.response?.data || error;
    });
  }

  async download(url, fileName, withCredentials = false) {
    let urlObject = null;
    try {
      const response = await axios.get(url, { responseType: 'blob', withCredentials });
      urlObject = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlObject;
      link.setAttribute('download', fileName || url.split('/').pop());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      if (urlObject) {
        URL.revokeObjectURL(urlObject);
      }
    }
  }
}

export default HttpClient;
