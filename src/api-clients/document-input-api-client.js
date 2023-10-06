import HttpClient from './http-client.js';

class DocumentInputApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getDocumentInput(documentInputId) {
    return this.httpClient
      .get(
        `/api/v1/doc-inputs/${encodeURIComponent(documentInputId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getDocumentInputsByDocumentId(documentId) {
    return this.httpClient
      .get(
        `/api/v1/doc-inputs/documents/${encodeURIComponent(documentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getDocumentInputsCreatedByUser(userId) {
    return this.httpClient
      .get(
        `/api/v1/doc-inputs/users/${encodeURIComponent(userId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  createDocumentInput({ documentId, documentRevisionId, sections }) {
    return this.httpClient
      .post(
        '/api/v1/doc-inputs',
        { documentId, documentRevisionId, sections },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  hardDeleteDocumentInput(documentInputId) {
    return this.httpClient
      .delete(
        '/api/v1/doc-inputs',
        {
          data: { documentInputId },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }
}

export default DocumentInputApiClient;
