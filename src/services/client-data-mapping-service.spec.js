import urlUtils from '../utils/url-utils.js';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import UserStore from '../stores/user-store.js';
import permissions from '../domain/permissions.js';
import MarkdownInfo from '../plugins/markdown/markdown-info.js';
import ClientDataMappingService from './client-data-mapping-service.js';
import { BATCH_TYPE, FAVORITE_TYPE, ROLE, TASK_TYPE } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestRoom, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('client-data-mapping-service', () => {
  const sandbox = createSandbox();

  let markdownInfo;
  let userStore;
  let container;
  let user1;
  let user2;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    userStore = container.get(UserStore);
    markdownInfo = container.get(MarkdownInfo);
    sut = container.get(ClientDataMappingService);
  });

  beforeEach(async () => {
    user1 = await setupTestUser(container, { email: 'user1@test.com', displayName: 'Test user 1' });
    user2 = await setupTestUser(container, { email: 'user2@test.com', displayName: 'Test user 2' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('mapWebsitePublicUser', () => {
    let result;
    let viewedUser;
    let viewingUser;

    beforeEach(() => {
      viewedUser = {
        _id: 'k991UQneLdmDGrAgqR7s6q',
        displayName: 'Test user',
        passwordHash: '$2b$04$9elh9hoLz/8p8lJaqdSl5.aN2bse1lqDDKCZn2gEft3bIscnEP2Ke',
        email: 'test@test.com',
        roles: ['user', 'admin'],
        expiresOn: null,
        verificationCode: null,
        organization: 'Educandu',
        introduction: 'Educandu test user',
        storage: {},
        favorites: [],
        accountLockedOn: null,
        accountClosedOn: null
      };
      sandbox.stub(urlUtils, 'getGravatarUrl').withArgs(viewedUser.email).returns('www://avatar.domain/12345');
    });

    describe('when the viewing user is annonymous', () => {
      beforeEach(() => {
        viewingUser = null;
        result = sut.mapWebsitePublicUser({ viewedUser, viewingUser });
      });

      it('should map the public user data excluding the email', () => {
        expect(result).toStrictEqual({
          _id: 'k991UQneLdmDGrAgqR7s6q',
          displayName: 'Test user',
          organization: 'Educandu',
          introduction: 'Educandu test user',
          avatarUrl: 'www://avatar.domain/12345',
          accountClosedOn: null
        });
      });
    });

    describe('when the viewing user has closed their account', () => {
      const accountClosedOn = new Date();

      beforeEach(() => {
        viewingUser = { roles: [ROLE.user] };
        viewedUser.accountClosedOn = accountClosedOn;

        urlUtils.getGravatarUrl.withArgs(null).returns('www://avatar.domain/placeholder');
        result = sut.mapWebsitePublicUser({ viewedUser, viewingUser });
      });

      it('should map the remaining public user data excluding the avatar', () => {
        expect(result).toStrictEqual({
          _id: 'k991UQneLdmDGrAgqR7s6q',
          displayName: 'Test user',
          organization: 'Educandu',
          introduction: 'Educandu test user',
          avatarUrl: 'www://avatar.domain/placeholder',
          accountClosedOn: accountClosedOn.toISOString()
        });
      });
    });

    describe(`when the viewing user does not have '${permissions.SEE_USER_EMAIL}' permission`, () => {
      beforeEach(() => {
        viewingUser = { roles: [ROLE.user] };
        result = sut.mapWebsitePublicUser({ viewedUser, viewingUser });
      });

      it('should map the public user data excluding the email', () => {
        expect(result).toStrictEqual({
          _id: 'k991UQneLdmDGrAgqR7s6q',
          displayName: 'Test user',
          organization: 'Educandu',
          introduction: 'Educandu test user',
          avatarUrl: 'www://avatar.domain/12345',
          accountClosedOn: null
        });
      });
    });

    describe(`when the viewing user has '${permissions.SEE_USER_EMAIL}' permission`, () => {
      beforeEach(() => {
        viewingUser = { roles: [ROLE.user, ROLE.maintainer] };
        result = sut.mapWebsitePublicUser({ viewedUser, viewingUser });
      });

      it('should map the public user data including the email', () => {
        expect(result).toStrictEqual({
          _id: 'k991UQneLdmDGrAgqR7s6q',
          displayName: 'Test user',
          email: 'test@test.com',
          organization: 'Educandu',
          introduction: 'Educandu test user',
          avatarUrl: 'www://avatar.domain/12345',
          accountClosedOn: null
        });
      });
    });
  });

  describe('mapWebsiteUser', () => {
    let result;
    let dbUser;
    const favoriteSetOnDate = new Date();

    beforeEach(() => {
      dbUser = {
        _id: 'k991UQneLdmDGrAgqR7s6q',
        displayName: 'Test user',
        passwordHash: '$2b$04$9elh9hoLz/8p8lJaqdSl5.aN2bse1lqDDKCZn2gEft3bIscnEP2Ke',
        email: 'test@test.com',
        roles: ['user', 'admin'],
        expiresOn: null,
        verificationCode: null,
        accountLockedOn: null,
        organization: 'Educandu',
        introduction: 'Educandu test user',
        storage: {
          plan: 'lkdkgfj',
          usedBytes: 0,
          reminders: [
            {
              timestamp: new Date(),
              createdBy: 'kjghdskjhgfdsf'
            }
          ]
        },
        favorites: [
          {
            type: FAVORITE_TYPE.document,
            id: '4589ct29nr76n4x9214',
            setOn: favoriteSetOnDate
          }
        ]
      };
      result = sut.mapWebsiteUser(dbUser);
    });

    it('should map the user from the database', () => {
      expect(result).toStrictEqual({
        _id: 'k991UQneLdmDGrAgqR7s6q',
        displayName: 'Test user',
        email: 'test@test.com',
        roles: ['user', 'admin'],
        organization: 'Educandu',
        introduction: 'Educandu test user',
        storage: {
          plan: 'lkdkgfj',
          usedBytes: 0
        },
        favorites: [
          {
            type: FAVORITE_TYPE.document,
            id: '4589ct29nr76n4x9214',
            setOn: favoriteSetOnDate.toISOString()
          }
        ]
      });
    });
  });

  describe('mapBatches', () => {
    let result;
    let batches;

    beforeEach(async () => {
      batches = [
        {
          createdOn: new Date(),
          completedOn: new Date(),
          createdBy: user2._id,
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentRegeneration,
              taskParams: {},
              attempts: []
            }
          ]
        }
      ];
      result = await sut.mapBatches(batches, user1);
    });

    it('should map the batches', () => {
      expect(result).toEqual([
        {
          createdOn: batches[0].createdOn.toISOString(),
          completedOn: batches[0].completedOn.toISOString(),
          createdBy: {
            _id: user2._id,
            displayName: user2.displayName
          },
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentRegeneration,
              taskParams: {},
              attempts: []
            }
          ]
        }
      ]);
    });
  });

  describe('mapBatch', () => {
    let result;
    let batch;

    describe('for batches/tasks of type `document-regeneration`', () => {
      beforeEach(async () => {
        batch = {
          createdOn: new Date(),
          completedOn: new Date(),
          createdBy: user1._id,
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentRegeneration,
              taskParams: {},
              attempts: [
                {
                  startedOn: new Date(),
                  completedOn: new Date()
                }
              ]
            }
          ]
        };

        result = await sut.mapBatch(batch, user1);
      });

      it('should map the batch', () => {
        expect(result).toEqual({
          createdOn: batch.createdOn.toISOString(),
          completedOn: batch.completedOn.toISOString(),
          createdBy: {
            _id: user1._id,
            displayName: user1.displayName
          },
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentRegeneration,
              taskParams: {},
              attempts: [
                {
                  startedOn: batch.tasks[0].attempts[0].startedOn.toISOString(),
                  completedOn: batch.tasks[0].attempts[0].completedOn.toISOString()
                }
              ]
            }
          ]
        });
      });
    });

  });

  describe('mapRoom', () => {
    let result;

    const owner = {
      _id: 'owner',
      email: 'owner@owner',
      displayName: 'Owner user',
      storage: { plan: 'basic', usedBytes: 20, reminders: [] }
    };

    const member1 = {
      _id: 'member1',
      displayName: 'Member user 1'
    };

    const member2 = {
      _id: 'member2',
      displayName: 'Member user 2'
    };

    const room = {
      _id: 'roomId',
      name: 'my room',
      owner: 'owner',
      createdOn: new Date(),
      updatedOn: new Date(),
      members: [
        {
          userId: 'member1',
          joinedOn: new Date()
        },
        {
          userId: 'member2',
          joinedOn: new Date()
        }
      ]
    };

    beforeEach(async () => {
      sandbox.stub(userStore, 'getUserById').resolves(owner);
      sandbox.stub(userStore, 'getUsersByIds').resolves([member1, member2]);
      result = await sut.mapRoom(room, { roles: [ROLE.admin] });
    });

    it('should call getUserById with "owner"', () => {
      assert.calledWith(userStore.getUserById, 'owner');
    });

    it('should call getUsersById with "[member1, memeber2]"', () => {
      assert.calledWith(userStore.getUsersByIds, ['member1', 'member2']);
    });

    it('should return the mapped result', () => {
      expect(result).toEqual({
        ...room,
        createdOn: room.createdOn.toISOString(),
        updatedOn: room.updatedOn.toISOString(),
        owner: {
          displayName: owner.displayName,
          email: owner.email,
          _id: owner._id
        },
        members: [
          {
            userId: room.members[0].userId,
            displayName: member1.displayName,
            joinedOn: room.members[0].joinedOn.toISOString(),
            avatarUrl: '//www.gravatar.com/avatar/d415f0e30c471dfdd9bc4f827329ef48?s=110&d=mp'
          },
          {
            userId: room.members[1].userId,
            displayName: member2.displayName,
            joinedOn: room.members[1].joinedOn.toISOString(),
            avatarUrl: '//www.gravatar.com/avatar/d415f0e30c471dfdd9bc4f827329ef48?s=110&d=mp'
          }
        ]
      });
    });
  });

  describe('mapRoomInvitations', () => {
    let result;
    let invitations;

    beforeEach(async () => {
      invitations = [{ roomId: 'roomId', sentOn: new Date(), expiresOn: new Date() }];
      result = await sut.mapRoomInvitations(invitations);
    });

    it('shoult map the invitations', () => {
      expect(result).toEqual([
        {
          roomId: 'roomId',
          sentOn: invitations[0].sentOn.toISOString(),
          expiresOn: invitations[0].expiresOn.toISOString()
        }
      ]);
    });
  });

  describe('mapUserOwnRoomInvitations', () => {
    let result;
    let room;
    let invitation;

    beforeEach(async () => {
      room = await createTestRoom(container, { owner: user1._id });
      invitation = { _id: uniqueId.create(), roomId: room._id, sentOn: new Date(), expiresOn: new Date() };

      result = await sut.mapUserOwnRoomInvitations(invitation);
    });

    it('shoult map room data into the basic invitation data', () => {
      expect(result).toEqual({
        _id: invitation._id,
        token: invitation.token,
        sentOn: invitation.sentOn.toISOString(),
        expiresOn: invitation.expiresOn.toISOString(),
        room: {
          _id: room._id,
          name: room.name,
          documentsMode: room.documentsMode,
          owner: {
            displayName: user1.displayName
          }
        }
      });
    });
  });

  describe('mapComment', () => {
    let result;
    let comment;

    beforeEach(async () => {
      comment = {
        documentId: uniqueId.create(),
        createdBy: user1._id,
        createdOn: new Date(),
        deletedOn: new Date(),
        deletedBy: user2._id
      };
      result = await sut.mapComment(comment);
    });

    it('should map comment data', () => {
      expect(result).toEqual({
        ...comment,
        createdBy: {
          _id: user1._id,
          displayName: user1.displayName
        },
        createdOn: comment.createdOn.toISOString(),
        deletedOn: comment.deletedOn.toISOString(),
        deletedBy: {
          _id: user2._id,
          displayName: user2.displayName
        }
      });
    });
  });

  describe('createProposedSections', () => {
    let result;
    let targetRoomId;
    let testSection;
    let testDocument;

    beforeEach(() => {
      targetRoomId = uniqueId.create();

      testSection = {
        key: uniqueId.create(),
        revision: uniqueId.create(),
        deletedOn: null,
        deletedBy: null,
        deletedBecause: null,
        type: MarkdownInfo.typeName,
        content: { ...markdownInfo.getDefaultContent(), text: 'original' }
      };

      testDocument = {
        _id: uniqueId.create(),
        roomId: uniqueId.create(),
        sections: [testSection]
      };
    });

    describe('when called with a document that has a valid section', () => {
      let redactedContent;
      beforeEach(() => {
        redactedContent = { ...markdownInfo.getDefaultContent(), text: 'redacted' };
        sandbox.stub(markdownInfo, 'redactContent').withArgs(testSection.content).returns(redactedContent);
        result = sut.createProposedSections(testDocument, targetRoomId);
      });
      it('returns an array that includes that section', () => {
        expect(result).toHaveLength(1);
      });
      it('assigns a new key to that section', () => {
        expect(result[0].key).not.toEqual(testSection.key);
      });
      it('sets the revision to null for that section', () => {
        expect(result[0].revision).toBeNull();
      });
      it('calls redactContent for that section\'s content on the respective plugin info', () => {
        assert.calledOnceWithExactly(markdownInfo.redactContent, testSection.content, targetRoomId);
      });
      it('assigns the redacted content to that section', () => {
        expect(result[0].content).toStrictEqual(redactedContent);
      });
    });

    describe('when called with a document that has a deleted section', () => {
      beforeEach(() => {
        testSection.content = null;
        result = sut.createProposedSections(testDocument, targetRoomId);
      });
      it('returns an array that does not include that section', () => {
        expect(result).toHaveLength(0);
      });
    });

    describe('when called with a document that has a section with unknown type', () => {
      beforeEach(() => {
        testSection.type = 'i-really-do-not-know';
        result = sut.createProposedSections(testDocument, targetRoomId);
      });
      it('returns an array that does not include that section', () => {
        expect(result).toHaveLength(0);
      });
    });
  });
});
