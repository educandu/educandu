import HttpClient from './http-client.js';

class CommentApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  addComment({ documentId, topic, text }) {
    return this.httpClient
      .put(
        '/api/v1/comments',
        { documentId, topic, text },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateComment({ commentId, topic }) {
    return this.httpClient
      .post(
        `/api/v1/comments/${encodeURIComponent(commentId)}`,
        { topic },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteComment({ commentId }) {
    return this.httpClient
      .delete(
        `/api/v1/comments/${encodeURIComponent(commentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getAllDocumentComments({ documentId }) {
    return this.httpClient
      .get(
        `/api/v1/comments?query=${encodeURIComponent(documentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default CommentApiClient;
