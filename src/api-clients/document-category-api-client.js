import HttpClient from './http-client.js';

class DocumentCategoryApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  requestDocumentCategoryCreation({ name, iconUrl, description }) {
    return this.httpClient
      .post(
        '/api/v1/document-categories/request-creation',
        { name, iconUrl, description },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateDocumentCategory({ documentCategoryId, name, iconUrl, description }) {
    return this.httpClient
      .patch(
        `/api/v1/document-categories/${encodeURIComponent(documentCategoryId)}`,
        { name, iconUrl, description },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentCategoryApiClient;
