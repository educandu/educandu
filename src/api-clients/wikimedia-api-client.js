import HttpClient from './http-client.js';
import urlUtils from '../utils/url-utils.js';
import { WIKIMEDIA_API_FILE_TYPE, WIKIMEDIA_COMMONS_API_URL } from '../utils/wikimedia-utils.js';

class WikimediaApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  queryMediaFiles({ searchText, fileTypes = Object.values(WIKIMEDIA_API_FILE_TYPE), thumbnailHeight = 180, limit = 50, offset = 0 }) {
    const queryString = urlUtils.composeQueryString({
      action: 'query',
      format: 'json',
      uselang: 'en',
      generator: 'search',
      gsrsearch: `filetype:${fileTypes.join('|')} ${searchText}`,
      gsrlimit: limit,
      gsroffset: offset,
      gsrnamespace: '*',
      prop: 'info|imageinfo',
      inprop: 'url',
      iiprop: 'url|size|mime',
      iiurlheight: thumbnailHeight,
      origin: '*'
    });

    return this.httpClient
      .get(`${WIKIMEDIA_COMMONS_API_URL}?${queryString}`, { responseType: 'json' })
      .then(res => res.data);
  }
}

export default WikimediaApiClient;
