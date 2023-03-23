import HttpClient from './http-client.js';

class DocumentCommentApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  addDocumentComment({ documentId, topic, text }) {
    return this.httpClient
      .put(
        '/api/v1/document-comments',
        { documentId, topic, text },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateDocumentCommentsTopic({ documentId, oldTopic, newTopic }) {
    return this.httpClient
      .post(
        '/api/v1/document-comments/topic',
        { documentId, oldTopic, newTopic },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteDocumentComment({ documentCommentId }) {
    return this.httpClient
      .delete(
        `/api/v1/document-comments/${encodeURIComponent(documentCommentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getAllDocumentComments({ documentId }) {
    return this.httpClient
      .get(
        `/api/v1/document-comments?documentId=${encodeURIComponent(documentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentCommentApiClient;
