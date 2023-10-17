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

  getDocumentInputsByRoomId(roomId) {
    return this.httpClient
      .get(
        `/api/v1/doc-inputs/rooms/${encodeURIComponent(roomId)}`,
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

  createDocumentInput({ documentId, documentRevisionId, sections, pendingFileMap }) {
    const formData = new FormData();
    formData.append('documentInput', JSON.stringify({ documentId, documentRevisionId, sections }));
    Object.entries(pendingFileMap).forEach(([key, file]) => formData.append('files[]', file, key));

    return this.httpClient
      .post(
        '/api/v1/doc-inputs',
        formData,
        {
          responseType: 'json',
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      .then(res => res.data);
  }

  createDocumentInputSectionComment({ documentInputId, sectionKey, text }) {
    return this.httpClient
      .post(
        `/api/v1/doc-inputs/${encodeURIComponent(documentInputId)}/sections/${encodeURIComponent(sectionKey)}/comments`,
        { text },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteDocumentInputSectionComment({ documentInputId, sectionKey, commentKey }) {
    return this.httpClient
      .delete(
        `/api/v1/doc-inputs/${encodeURIComponent(documentInputId)}/sections/${encodeURIComponent(sectionKey)}/comments`,
        {
          data: { commentKey },
          responseType: 'json'
        }
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
