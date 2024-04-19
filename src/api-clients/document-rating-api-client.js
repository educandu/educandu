import HttpClient from './http-client.js';

class DocumentRatingApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getRating({ documentId }) {
    return this.httpClient
      .get(
        `/api/v1/document-ratings/${encodeURIComponent(documentId)}/ratings`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveRating({ documentId, value }) {
    return this.httpClient
      .post(
        `/api/v1/document-ratings/${encodeURIComponent(documentId)}/ratings`,
        { value },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteRating({ documentId }) {
    return this.httpClient
      .delete(
        `/api/v1/document-ratings/${encodeURIComponent(documentId)}/ratings`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getMaintenanceDocumentRatings() {
    return this.httpClient
      .get(
        '/api/v1/document-ratings/maintenance',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentRatingApiClient;
