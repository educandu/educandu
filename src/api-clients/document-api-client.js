import HttpClient from './http-client.js';

class DocumentApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getDocument(documentId) {
    return this.httpClient
      .get(
        `/api/v1/docs/${encodeURIComponent(documentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getSearchableDocumentsTitles({ query }) {
    return this.httpClient
      .get(
        `/api/v1/docs/titles?query=${encodeURIComponent(query || '')}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  createDocument(data) {
    return this.httpClient
      .post(
        '/api/v1/docs',
        data,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateDocumentMetadata({ documentId, metadata }) {
    return this.httpClient
      .patch(
        `/api/v1/docs/${encodeURIComponent(documentId)}/metadata`,
        metadata,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateDocumentSections({ documentId, sections }) {
    return this.httpClient
      .patch(
        `/api/v1/docs/${encodeURIComponent(documentId)}/sections`,
        { sections },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  restoreDocumentRevision({ documentId, revisionId }) {
    return this.httpClient
      .patch(
        `/api/v1/docs/${encodeURIComponent(documentId)}/restore`,
        { revisionId },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getDocumentRevisions(documentId) {
    return this.httpClient
      .get(
        '/api/v1/docs',
        {
          params: { documentId },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  hardDeleteSection({ documentId, sectionKey, sectionRevision, reason, deleteAllRevisions }) {
    return this.httpClient
      .delete(
        '/api/v1/docs/sections',
        {
          data: {
            documentId,
            sectionKey,
            sectionRevision,
            reason,
            deleteAllRevisions: !!deleteAllRevisions
          },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  hardDeleteDocument(documentId) {
    return this.httpClient
      .delete(
        '/api/v1/docs',
        {
          data: { documentId },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  getDocumentTagSuggestions(tagsSuggestionQuery) {
    return this.httpClient
      .get(
        `/api/v1/docs/tags/${encodeURIComponent(tagsSuggestionQuery)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  archiveDocument(documentId) {
    return this.httpClient
      .patch(
        `/api/v1/docs/${encodeURIComponent(documentId)}/archive`,
        null,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  unarchiveDocument(documentId) {
    return this.httpClient
      .patch(
        `/api/v1/docs/${encodeURIComponent(documentId)}/unarchive`,
        null,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentApiClient;
