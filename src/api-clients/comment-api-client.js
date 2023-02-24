import HttpClient from './http-client.js';

class CommentApiClient {
  static dependencies = [HttpClient];

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

  updateCommentsTopic({ documentId, oldTopic, newTopic }) {
    return this.httpClient
      .post(
        '/api/v1/comments/topic',
        { documentId, oldTopic, newTopic },
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
        `/api/v1/comments?documentId=${encodeURIComponent(documentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default CommentApiClient;
