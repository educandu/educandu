import HttpClient from './http-client.js';
import urlUtils from '../utils/url-utils.js';

class DocumentRequestApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getContentManagementDocumentRequests({ registeredFrom, registeredUntil, daysOfWeek } = {}) {
    const queryString = urlUtils.composeQueryString({ registeredFrom, registeredUntil, daysOfWeek });
    return this.httpClient
      .get(
        `/api/v1/document-requests/content-management?${queryString}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentRequestApiClient;
