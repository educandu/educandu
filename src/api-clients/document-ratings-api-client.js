import HttpClient from './http-client.js';

class DocumentRatingApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getUserDocumentRating({ documentId }) {
    return this.httpClient
      .get(
        `/api/v1/user-document-ratings/${encodeURIComponent(documentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveUserDocumentRating({ documentId, rating }) {
    return this.httpClient
      .post(
        `/api/v1/user-document-ratings/${encodeURIComponent(documentId)}`,
        { rating },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteUserDocumentRating({ documentId }) {
    return this.httpClient
      .delete(
        `/api/v1/user-document-ratings/${encodeURIComponent(documentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentRatingApiClient;
