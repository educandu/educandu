import HttpClient from './http-client';

class DocumentApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  saveDocument(data) {
    return this.httpClient
      .post('/api/v1/docs')
      .accept('json')
      .type('json')
      .send(data)
      .then(res => res.body);
  }

  getDocumentRevisions(key) {
    return this.httpClient
      .get('/api/v1/docs')
      .query({ key })
      .accept('json')
      .then(res => res.body);
  }

  hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteDescendants }) {
    return this.httpClient
      .delete('/api/v1/docs/sections')
      .accept('json')
      .type('json')
      .send({
        documentKey,
        sectionKey,
        sectionRevision,
        reason,
        deleteDescendants: !!deleteDescendants
      })
      .then(res => res.body);
  }
}

export default DocumentApiClient;
