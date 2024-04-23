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

  updateDocumentCategoryDocuments({ documentCategoryId, documentIds }) {
    return this.httpClient
      .patch(
        `/api/v1/document-categories/${encodeURIComponent(documentCategoryId)}/documents`,
        { documentIds },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteDocumentCategory({ documentCategoryId }) {
    return this.httpClient
      .delete(
        `/api/v1/document-categories/${encodeURIComponent(documentCategoryId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentCategoryApiClient;
