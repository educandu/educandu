const HttpClient = require('./http-client');

class DocumentApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  saveDocument(doc) {
    return this.httpClient
      .post('/api/v1/docs')
      .accept('json')
      .type('json')
      .send(doc)
      .then(res => res.body);
  }

  getDocumentHistory(docId) {
    return this.httpClient
      .get(`/api/v1/docs/${docId}`)
      .query({ fullHistory: true })
      .accept('json')
      .then(res => res.body);
  }

  hardDeleteSection(key, order, reason, deleteDescendants) {
    return this.httpClient
      .delete('/api/v1/docs/sections')
      .accept('json')
      .type('json')
      .send({
        key: key,
        order: order,
        reason: reason,
        deleteDescendants: !!deleteDescendants
      })
      .then(res => res.body);
  }
}

module.exports = DocumentApiClient;
