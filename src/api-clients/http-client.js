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

  async download(url, fileName) {
    let urlObject = null;
    try {
      const response = await axios.get(url, { responseType: 'blob' });
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
