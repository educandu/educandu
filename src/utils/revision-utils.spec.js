import uniqueId from './unique-id.js';
import { createSandbox } from 'sinon';
import cloneDeep from './clone-deep.js';
import { ROLE } from '../domain/constants.js';
import DocumentService from '../services/document-service.js';
import { destroyTestEnvironment, setupTestEnvironment } from '../test-helper.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { checkRevisionOnDocumentCreation, checkRevisionOnDocumentUpdate } from './revision-utils.js';

describe('revision-utils', () => {
  const sandbox = createSandbox();

  let container;
  let documentService;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    documentService = container.get(DocumentService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('checkRevisionOnDocumentCreation', () => {
    const documentId = uniqueId.create();
    let newRevision;
    let user;
    let room;

    beforeEach(() => {
      user = { _id: uniqueId.create(), roles: [ROLE.user] };
      newRevision = null;
      room = null;
    });

    it('should throw if the user is not allowed to create documents in general', () => {
      user = null;
      newRevision = documentService._buildDocumentRevision({ documentId, createdBy: uniqueId.create() });
      expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user }))
        .toThrow('User is not allowed to create documents');
    });

    describe('when the document is a room document', () => {
      beforeEach(() => {
        room = { _id: uniqueId.create(), owner: user._id, members: [], documents: [documentId], isCollaborative: true };
        newRevision = documentService._buildDocumentRevision({ documentId, roomId: room._id, createdBy: user._id, roomContext: { draft: false } });
      });

      it('should throw if the document is a draft and the user is not the room owner, just a collaborator', () => {
        room.owner = uniqueId.create();
        room.members = [user._id];
        newRevision.roomContext.draft = true;
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user }))
          .toThrow('Only room owners can create a draft document');
      });

      it('should throw if the user is not a collaborator', () => {
        room.owner = uniqueId.create();
        room.members = [user._id];
        room.isCollaborative = false;
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user }))
          .toThrow('Only room owners or collaborators can create a room document');
      });
    });

    describe('when the document is a public document', () => {
      beforeEach(() => {
        const publicContext = { accreditedEditors: [], protected: false, archived: false, verified: false, review: '' };
        newRevision = documentService._buildDocumentRevision({ documentId, createdBy: user._id, publicContext });
        room = null;
      });

      it('should throw if the document contains accredited editors and the user is not allowed to assign them', () => {
        newRevision.publicContext.accreditedEditors = [uniqueId.create(), uniqueId.create()];
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user }))
          .toThrow('User is not allowed to assign accredited editors');
      });

      it('should throw if the document contains the user as the only accredited editor but the user is not allowed to assign themselves', () => {
        newRevision.publicContext.accreditedEditors = [user._id];
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user }))
          .toThrow('User is not allowed to assign themselves as accredited editor');
      });

      it('should not throw if the document contains the user as the only accredited editor and the user is in the accredited author role', () => {
        user.roles = [ROLE.accreditedAuthor];
        newRevision.publicContext.accreditedEditors = [user._id];
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user })).not.toThrow();
      });

      it('should throw if the document is protected and the user is not allowed to protect documents', () => {
        newRevision.publicContext.protected = true;
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user }))
          .toThrow('User is not allowed to create a protected document');
      });

      it('should not throw if the document is protected and the user is in the accredited author role', () => {
        user.roles = [ROLE.accreditedAuthor];
        newRevision.publicContext.protected = true;
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user })).not.toThrow();
      });

      it('should throw if the document is archived and the user is not allowed to archive documents', () => {
        newRevision.publicContext.archived = true;
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user }))
          .toThrow('User is not allowed to create an archived document');
      });

      it('should not throw if the document is archived and the user is in the maintainer role', () => {
        user.roles = [ROLE.maintainer];
        newRevision.publicContext.archived = true;
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user })).not.toThrow();
      });

      it('should throw if the document is verified and the user is not allowed to verify documents', () => {
        newRevision.publicContext.verified = true;
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user }))
          .toThrow('User is not allowed to create a verified document');
      });

      it('should not throw if the document is verified and the user is in the maintainer role', () => {
        user.roles = [ROLE.maintainer];
        newRevision.publicContext.verified = true;
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user })).not.toThrow();
      });

      it('should throw if the document contains a review and the user is not allowed to review documents', () => {
        newRevision.publicContext.review = 'Very good document!';
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user }))
          .toThrow('User is not allowed to create a document with review');
      });

      it('should not throw if the document contains a review and the user is in the maintainer role', () => {
        user.roles = [ROLE.maintainer];
        newRevision.publicContext.review = 'Very good document!';
        expect(() => checkRevisionOnDocumentCreation({ newRevision, room, user })).not.toThrow();
      });
    });
  });

  describe('checkRevisionOnDocumentUpdate', () => {
    const documentId = uniqueId.create();
    let previousRevision;
    let newRevision;
    let user;
    let room;

    beforeEach(() => {
      user = { _id: uniqueId.create(), roles: [ROLE.user] };
      newRevision = null;
      room = null;
    });

    it('should throw if the user is not allowed to update documents in general', () => {
      user = null;
      previousRevision = documentService._buildDocumentRevision({ documentId, createdBy: uniqueId.create() });
      newRevision = { ...cloneDeep(previousRevision), _id: uniqueId.create() };
      expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
        .toThrow('User is not allowed to update documents');
    });

    it('should throw if the room ID of the previous and new revision do not match', () => {
      previousRevision = documentService._buildDocumentRevision({ documentId, createdBy: uniqueId.create() });
      newRevision = { ...cloneDeep(previousRevision), _id: uniqueId.create(), roomId: uniqueId.create() };
      expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
        .toThrow('Documents cannot be moved between rooms or public space');
    });

    describe('when the document is a room document', () => {
      beforeEach(() => {
        room = { _id: uniqueId.create(), owner: user._id, members: [], documents: [documentId], isCollaborative: true };
        previousRevision = documentService._buildDocumentRevision({ documentId, roomId: room._id, createdBy: user._id, roomContext: { draft: false } });
        newRevision = { ...cloneDeep(previousRevision), _id: uniqueId.create() };
      });

      it('should throw if the document is a draft and the user is not the room owner, just a collaborator', () => {
        room.owner = uniqueId.create();
        room.members = [user._id];
        previousRevision.roomContext.draft = true;
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
          .toThrow('Only room owners can update a draft document');
      });

      it('should throw if the user is not a collaborator', () => {
        room.owner = uniqueId.create();
        room.members = [user._id];
        room.isCollaborative = false;
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
          .toThrow('Only room owners or collaborators can update a room document');
      });
    });

    describe('when the document is a public document', () => {
      beforeEach(() => {
        const publicContext = { accreditedEditors: [], protected: false, archived: false, verified: false, review: '' };
        previousRevision = documentService._buildDocumentRevision({ documentId, createdBy: user._id, publicContext });
        newRevision = { ...cloneDeep(previousRevision), _id: uniqueId.create() };
        room = null;
      });

      it('should throw if the document is protected and the user is not in the maintainer role', () => {
        previousRevision.publicContext.protected = true;
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
          .toThrow('User is not allowed to update a protected document');
      });

      it('should not throw if the document is protected and the user is in the maintainer role', () => {
        user.roles = [ROLE.maintainer];
        previousRevision.publicContext.protected = true;
        newRevision = { ...cloneDeep(previousRevision), _id: uniqueId.create() };
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user })).not.toThrow();
      });

      it('should not throw if the document is protected and the user is not in the maintainer role but an accredited editor', () => {
        previousRevision.publicContext.protected = true;
        previousRevision.publicContext.accreditedEditors = [uniqueId.create(), user._id, uniqueId.create()];
        newRevision = { ...cloneDeep(previousRevision), _id: uniqueId.create() };
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user })).not.toThrow();
      });

      it('should throw if the document contains accredited editors and the user is not allowed to assign them', () => {
        previousRevision.publicContext.accreditedEditors = [uniqueId.create(), uniqueId.create()];
        newRevision.publicContext.accreditedEditors = [...previousRevision.publicContext.accreditedEditors, uniqueId.create()];
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
          .toThrow('User is not allowed to update accredited editors');
      });

      it('should not throw if the document contains accredited editors and the user is in the maintainer role', () => {
        user.roles = [ROLE.maintainer];
        previousRevision.publicContext.accreditedEditors = [uniqueId.create(), uniqueId.create()];
        newRevision.publicContext.accreditedEditors = [...previousRevision.publicContext.accreditedEditors, uniqueId.create()];
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user })).not.toThrow();
      });

      it('should throw if the revisions have different protected states and the user is not allowed to change them', () => {
        previousRevision.publicContext.protected = false;
        newRevision.publicContext.protected = true;
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
          .toThrow('User is not allowed to change the protected state of a document');
      });

      it('should not throw if the revisions have different protected states and the user is in the maintainer role', () => {
        user.roles = [ROLE.maintainer];
        previousRevision.publicContext.protected = false;
        newRevision.publicContext.protected = true;
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user })).not.toThrow();
      });

      it('should throw if the revisions have different archived states and the user is not allowed to change them', () => {
        previousRevision.publicContext.archived = false;
        newRevision.publicContext.archived = true;
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
          .toThrow('User is not allowed to change the archived state of a document');
      });

      it('should not throw if the revisions have different archived states and the user is in the maintainer role', () => {
        user.roles = [ROLE.maintainer];
        previousRevision.publicContext.archived = false;
        newRevision.publicContext.archived = true;
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user })).not.toThrow();
      });

      it('should throw if the revisions have different verified states and the user is not allowed to change them', () => {
        previousRevision.publicContext.verified = false;
        newRevision.publicContext.verified = true;
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
          .toThrow('User is not allowed to change the verified state of a document');
      });

      it('should not throw if the revisions have different verified states and the user is in the maintainer role', () => {
        user.roles = [ROLE.maintainer];
        previousRevision.publicContext.verified = false;
        newRevision.publicContext.verified = true;
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user })).not.toThrow();
      });

      it('should throw if the revisions contain different reviews and the user is not allowed to review documents', () => {
        previousRevision.publicContext.review = 'Very bad document!';
        newRevision.publicContext.review = 'Very good document!';
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }))
          .toThrow('User is not allowed to update the review of a document');
      });

      it('should not throw if the revisions contain different reviews and the user is in the maintainer role', () => {
        user.roles = [ROLE.maintainer];
        previousRevision.publicContext.review = 'Very bad document!';
        newRevision.publicContext.review = 'Very good document!';
        expect(() => checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user })).not.toThrow();
      });
    });
  });

});
