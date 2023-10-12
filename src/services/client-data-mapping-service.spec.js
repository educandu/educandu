import urlUtils from '../utils/url-utils.js';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import UserStore from '../stores/user-store.js';
import permissions from '../domain/permissions.js';
import ServerConfig from '../bootstrap/server-config.js';
import MarkdownInfo from '../plugins/markdown/markdown-info.js';
import ClientDataMappingService from './client-data-mapping-service.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BATCH_TYPE, EMAIL_NOTIFICATION_FREQUENCY, FAVORITE_TYPE, ROLE, TASK_TYPE } from '../domain/constants.js';
import { createTestRoom, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, createTestUser } from '../test-helper.js';

describe('client-data-mapping-service', () => {
  const sandbox = createSandbox();

  let serverConfig;
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
    serverConfig = container.get(ServerConfig);
    sut = container.get(ClientDataMappingService);
  });

  beforeEach(async () => {
    user1 = await createTestUser(container, { email: 'user1@test.com', displayName: 'Test user 1' });
    user2 = await createTestUser(container, { email: 'user2@test.com', displayName: 'Test user 2' });
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
        role: 'admin',
        expiresOn: null,
        verificationCode: null,
        organization: 'Educandu',
        profileOverview: 'About Educandu test user',
        shortDescription: 'Educandu test user',
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
          profileOverview: 'About Educandu test user',
          shortDescription: 'Educandu test user',
          avatarUrl: 'www://avatar.domain/12345',
          accountClosedOn: null
        });
      });
    });

    describe('when the viewing user has closed their account', () => {
      const accountClosedOn = new Date();

      beforeEach(() => {
        viewingUser = { role: ROLE.user };
        viewedUser.accountClosedOn = accountClosedOn;

        urlUtils.getGravatarUrl.withArgs(null).returns('www://avatar.domain/placeholder');
        result = sut.mapWebsitePublicUser({ viewedUser, viewingUser });
      });

      it('should map the remaining public user data excluding the avatar', () => {
        expect(result).toStrictEqual({
          _id: 'k991UQneLdmDGrAgqR7s6q',
          displayName: 'Test user',
          organization: 'Educandu',
          profileOverview: 'About Educandu test user',
          shortDescription: 'Educandu test user',
          avatarUrl: 'www://avatar.domain/placeholder',
          accountClosedOn: accountClosedOn.toISOString()
        });
      });
    });

    describe(`when the viewing user does not have '${permissions.VIEW_USERS}' permission`, () => {
      beforeEach(() => {
        viewingUser = { role: ROLE.user };
        result = sut.mapWebsitePublicUser({ viewedUser, viewingUser });
      });

      it('should map the public user data excluding the email', () => {
        expect(result).toStrictEqual({
          _id: 'k991UQneLdmDGrAgqR7s6q',
          displayName: 'Test user',
          organization: 'Educandu',
          profileOverview: 'About Educandu test user',
          shortDescription: 'Educandu test user',
          avatarUrl: 'www://avatar.domain/12345',
          accountClosedOn: null
        });
      });
    });

    describe(`when the viewing user has '${permissions.VIEW_USERS}' permission`, () => {
      beforeEach(() => {
        viewingUser = { role: ROLE.maintainer };
        result = sut.mapWebsitePublicUser({ viewedUser, viewingUser });
      });

      it('should map the public user data including the email', () => {
        expect(result).toStrictEqual({
          _id: 'k991UQneLdmDGrAgqR7s6q',
          displayName: 'Test user',
          email: 'test@test.com',
          organization: 'Educandu',
          profileOverview: 'About Educandu test user',
          shortDescription: 'Educandu test user',
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
        role: 'admin',
        expiresOn: null,
        verificationCode: null,
        accountLockedOn: null,
        organization: 'Educandu',
        profileOverview: 'About Educandu test user',
        shortDescription: 'Educandu test user',
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
        ],
        emailNotificationFrequency: EMAIL_NOTIFICATION_FREQUENCY.monthly
      };
      result = sut.mapWebsiteUser(dbUser);
    });

    it('should map the user from the database', () => {
      expect(result).toStrictEqual({
        _id: 'k991UQneLdmDGrAgqR7s6q',
        displayName: 'Test user',
        email: 'test@test.com',
        role: 'admin',
        organization: 'Educandu',
        profileOverview: 'About Educandu test user',
        shortDescription: 'Educandu test user',
        favorites: [
          {
            type: FAVORITE_TYPE.document,
            id: '4589ct29nr76n4x9214',
            setOn: favoriteSetOnDate.toISOString()
          }
        ],
        emailNotificationFrequency: EMAIL_NOTIFICATION_FREQUENCY.monthly
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
    let room;
    let owner;
    let member1;
    let member2;

    beforeEach(() => {
      owner = {
        _id: 'ownerId',
        email: 'owner@owner',
        displayName: 'Owner user',
        storage: { plan: 'basic', usedBytes: 20, reminders: [] }
      };

      member1 = {
        _id: 'member1',
        email: 'member1@test.com',
        displayName: 'Member user 1'
      };

      member2 = {
        _id: 'member2',
        email: 'member2@test.com',
        displayName: 'Member user 2'
      };

      room = {
        _id: 'roomId',
        name: 'my room',
        ownedBy: 'ownerId',
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
        ],
        messages: [
          {
            key: 'messageKey',
            text: 'message',
            emailNotification: true,
            createdOn: new Date()
          }
        ],
        documents: ['documentId1']
      };

      sandbox.stub(userStore, 'getUserById').resolves(owner);
      sandbox.stub(userStore, 'getUsersByIds').resolves([member1, member2]);
      sandbox.stub(urlUtils, 'getGravatarUrl');
      urlUtils.getGravatarUrl.withArgs(member1.email).returns(`www://avatar.domain/${member1.email}`);
      urlUtils.getGravatarUrl.withArgs(member2.email).returns(`www://avatar.domain/${member2.email}`);
    });

    describe('when the viewingUser is the room owner', () => {
      beforeEach(async () => {
        result = await sut.mapRoom({ room, viewingUser: { _id: owner._id, role: ROLE.admin } });
      });

      it('should call getUserById with the owner id', () => {
        assert.calledWith(userStore.getUserById, 'ownerId');
      });

      it('should call getUsersById with "[member1, member2]"', () => {
        assert.calledWith(userStore.getUsersByIds, ['member1', 'member2']);
      });

      it('should return the mapped result', () => {
        expect(result).toEqual({
          ...room,
          createdOn: room.createdOn.toISOString(),
          updatedOn: room.updatedOn.toISOString(),
          ownedBy: room.ownedBy,
          owner: {
            displayName: owner.displayName,
            email: owner.email,
            _id: owner._id
          },
          members: [
            {
              userId: room.members[0].userId,
              email: member1.email,
              displayName: member1.displayName,
              joinedOn: room.members[0].joinedOn.toISOString(),
              avatarUrl: 'www://avatar.domain/member1@test.com'
            },
            {
              userId: room.members[1].userId,
              email: member2.email,
              displayName: member2.displayName,
              joinedOn: room.members[1].joinedOn.toISOString(),
              avatarUrl: 'www://avatar.domain/member2@test.com'
            }
          ],
          messages: [
            {
              key: room.messages[0].key,
              text: room.messages[0].text,
              emailNotification: room.messages[0].emailNotification,
              createdOn: room.messages[0].createdOn.toISOString()
            }
          ],
          documents: ['documentId1']
        });
      });
    });

    describe('when the viewingUser is the room owner and one member is a non existent users', () => {
      beforeEach(async () => {
        userStore.getUsersByIds.resolves([member1]);
        result = await sut.mapRoom({ room, viewingUser: { _id: owner._id, role: ROLE.admin } });
      });

      it('should call getUserById with the owner id', () => {
        assert.calledWith(userStore.getUserById, 'ownerId');
      });

      it('should call getUsersById with "[member1, member2]"', () => {
        assert.calledWith(userStore.getUsersByIds, ['member1', 'member2']);
      });

      it('should return the mapped result', () => {
        expect(result).toEqual({
          ...room,
          createdOn: room.createdOn.toISOString(),
          updatedOn: room.updatedOn.toISOString(),
          ownedBy: room.ownedBy,
          owner: {
            displayName: owner.displayName,
            email: owner.email,
            _id: owner._id
          },
          members: [
            {
              userId: room.members[0].userId,
              email: member1.email,
              displayName: member1.displayName,
              joinedOn: room.members[0].joinedOn.toISOString(),
              avatarUrl: 'www://avatar.domain/member1@test.com'
            }
          ],
          messages: [
            {
              key: room.messages[0].key,
              text: room.messages[0].text,
              emailNotification: room.messages[0].emailNotification,
              createdOn: room.messages[0].createdOn.toISOString()
            }
          ],
          documents: ['documentId1']
        });
      });
    });

    describe('when the viewingUser is not set', () => {
      beforeEach(async () => {
        result = await sut.mapRoom({ room });
      });

      it('should call getUserById with the owner id', () => {
        assert.calledWith(userStore.getUserById, 'ownerId');
      });

      it('should call getUsersById with "[member1, member2]"', () => {
        assert.calledWith(userStore.getUsersByIds, ['member1', 'member2']);
      });

      it('should return the mapped result', () => {
        expect(result).toEqual({
          ...room,
          createdOn: room.createdOn.toISOString(),
          updatedOn: room.updatedOn.toISOString(),
          ownedBy: room.ownedBy,
          owner: {
            displayName: owner.displayName,
            _id: owner._id
          },
          members: [
            {
              userId: room.members[0].userId,
              displayName: member1.displayName,
              joinedOn: room.members[0].joinedOn.toISOString(),
              avatarUrl: 'www://avatar.domain/member1@test.com'
            },
            {
              userId: room.members[1].userId,
              displayName: member2.displayName,
              joinedOn: room.members[1].joinedOn.toISOString(),
              avatarUrl: 'www://avatar.domain/member2@test.com'
            }
          ],
          messages: [
            {
              key: room.messages[0].key,
              text: room.messages[0].text,
              emailNotification: room.messages[0].emailNotification,
              createdOn: room.messages[0].createdOn.toISOString()
            }
          ],
          documents: ['documentId1']
        });
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
      room = await createTestRoom(container, { ownedBy: user1._id });
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
          isCollaborative: room.isCollaborative,
          shortDescription: '',
          ownedBy: room.ownedBy,
          owner: {
            _id: user1._id,
            displayName: user1.displayName
          }
        }
      });
    });
  });

  describe('mapDocumentComment', () => {
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
      result = await sut.mapDocumentComment(comment);
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
        type: 'markdown',
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

  describe('mapMediaLibraryItems', () => {
    let result;
    let items;

    beforeEach(async () => {
      items = [
        {
          _id: uniqueId.create(),
          roomId: uniqueId.create(),
          createdOn: new Date(),
          createdBy: user1._id,
          updatedOn: new Date(),
          updatedBy: user2._id,
          url: 'cdn://media-library/calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png'
        },
        {
          _id: uniqueId.create(),
          roomId: uniqueId.create(),
          createdOn: new Date(),
          createdBy: user2._id,
          updatedOn: new Date(),
          updatedBy: user1._id,
          url: 'cdn://media-library/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
        }
      ];
      sandbox.stub(serverConfig, 'cdnRootUrl').value('http://cdn-root');

      result = await sut.mapMediaLibraryItems(items, user1);
    });

    it('should map media library items data', () => {
      expect(result).toEqual([
        {
          ...items[0],
          createdOn: items[0].createdOn.toISOString(),
          createdBy: {
            _id: user1._id,
            displayName: user1.displayName
          },
          updatedOn: items[0].updatedOn.toISOString(),
          updatedBy: {
            _id: user2._id,
            displayName: user2.displayName
          },
          url: 'http://cdn-root/media-library/calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png',
          portableUrl: 'cdn://media-library/calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png',
          name: 'calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png'
        },
        {
          ...items[1],
          createdOn: items[1].createdOn.toISOString(),
          createdBy: {
            _id: user2._id,
            displayName: user2.displayName
          },
          updatedOn: items[1].updatedOn.toISOString(),
          updatedBy: {
            _id: user1._id,
            displayName: user1.displayName
          },
          url: 'http://cdn-root/media-library/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png',
          portableUrl: 'cdn://media-library/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png',
          name: 'flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
        }
      ]);
    });
  });

  describe('mapRoomMedia', () => {
    let result;
    let roomMedia;

    beforeEach(async () => {
      roomMedia = {
        storagePlan: 'plan1',
        usedBytes: '100',
        roomStorage: {
          roomId: 'room1',
          roomName: 'Room 1',
          roomMediaItems: [
            {
              _id: uniqueId.create(),
              roomId: uniqueId.create(),
              createdOn: new Date(),
              createdBy: user1._id,
              url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png'
            },
            {
              _id: uniqueId.create(),
              roomId: uniqueId.create(),
              createdOn: new Date(),
              createdBy: user2._id,
              url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
            }
          ]
        }
      };

      sandbox.stub(serverConfig, 'cdnRootUrl').value('http://cdn-root');

      result = await sut.mapRoomMedia(roomMedia, user1);
    });

    it('should map room media item data', () => {
      expect(result).toEqual({
        storagePlan: 'plan1',
        usedBytes: '100',
        roomStorage: {
          roomId: 'room1',
          roomName: 'Room 1',
          roomMediaItems: [
            {
              ...roomMedia.roomStorage.roomMediaItems[0],
              createdOn: roomMedia.roomStorage.roomMediaItems[0].createdOn.toISOString(),
              createdBy: {
                _id: user1._id,
                displayName: user1.displayName
              },
              url: 'http://cdn-root/room-media/dD6coNQoTsK8pgmy94P83g/calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png',
              portableUrl: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png',
              name: 'calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png'
            },
            {
              ...roomMedia.roomStorage.roomMediaItems[1],
              createdOn: roomMedia.roomStorage.roomMediaItems[1].createdOn.toISOString(),
              createdBy: {
                _id: user2._id,
                displayName: user2.displayName
              },
              url: 'http://cdn-root/room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png',
              portableUrl: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png',
              name: 'flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
            }
          ]
        }
      });
    });
  });

  describe('mapRoomMediaOverview', () => {
    let result;
    let roomMediaOverview;

    beforeEach(async () => {
      roomMediaOverview = {
        storagePlan: 'plan1',
        usedBytes: '100',
        roomStorageList: [
          {
            roomId: 'room1',
            roomName: 'Room 1',
            roomMediaItems: [
              {
                _id: uniqueId.create(),
                roomId: uniqueId.create(),
                createdOn: new Date(),
                createdBy: user1._id,
                url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png'
              },
              {
                _id: uniqueId.create(),
                roomId: uniqueId.create(),
                createdOn: new Date(),
                createdBy: user2._id,
                url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
              }
            ]
          },
          {
            roomId: 'room2',
            roomName: 'Room 2',
            roomMediaItems: [
              {
                _id: uniqueId.create(),
                roomId: uniqueId.create(),
                createdOn: new Date(),
                createdBy: user1._id,
                url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/boat-trips-KIoLnzk8NNwbxRWTHXmoI7.png'
              }
            ]
          }
        ]
      };

      sandbox.stub(serverConfig, 'cdnRootUrl').value('http://cdn-root');

      result = await sut.mapRoomMediaOverview(roomMediaOverview, user1);
    });

    it('should map room media item data', () => {
      expect(result).toEqual({
        storagePlan: 'plan1',
        usedBytes: '100',
        roomStorageList: [
          {
            roomId: 'room1',
            roomName: 'Room 1',
            roomMediaItems: [
              {
                ...roomMediaOverview.roomStorageList[0].roomMediaItems[0],
                createdOn: roomMediaOverview.roomStorageList[0].roomMediaItems[0].createdOn.toISOString(),
                createdBy: {
                  _id: user1._id,
                  displayName: user1.displayName
                },
                url: 'http://cdn-root/room-media/dD6coNQoTsK8pgmy94P83g/calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png',
                portableUrl: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png',
                name: 'calendar-times-cTKKnzk7MMwbxRWTHXmoJ5.png'
              },
              {
                ...roomMediaOverview.roomStorageList[0].roomMediaItems[1],
                createdOn: roomMediaOverview.roomStorageList[0].roomMediaItems[1].createdOn.toISOString(),
                createdBy: {
                  _id: user2._id,
                  displayName: user2.displayName
                },
                url: 'http://cdn-root/room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png',
                portableUrl: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png',
                name: 'flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
              }
            ]
          },
          {
            roomId: 'room2',
            roomName: 'Room 2',
            roomMediaItems: [
              {
                ...roomMediaOverview.roomStorageList[1].roomMediaItems[0],
                createdOn: roomMediaOverview.roomStorageList[1].roomMediaItems[0].createdOn.toISOString(),
                createdBy: {
                  _id: user1._id,
                  displayName: user1.displayName
                },
                url: 'http://cdn-root/room-media/dD6coNQoTsK8pgmy94P83g/boat-trips-KIoLnzk8NNwbxRWTHXmoI7.png',
                portableUrl: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/boat-trips-KIoLnzk8NNwbxRWTHXmoI7.png',
                name: 'boat-trips-KIoLnzk8NNwbxRWTHXmoI7.png'
              }
            ]
          }
        ]
      });
    });
  });

  describe('mapDocumentInputs', () => {
    let result;
    let documents;
    let documentInputs;

    beforeEach(async () => {
      documentInputs = [
        {
          _id: uniqueId.create(),
          documentId: uniqueId.create(),
          documentRevisionId: uniqueId.create(),
          createdOn: new Date(),
          createdBy: user1._id,
          updatedOn: new Date(),
          updatedBy: user1._id,
          sections: {}
        },
        {
          _id: uniqueId.create(),
          documentId: uniqueId.create(),
          documentRevisionId: uniqueId.create(),
          createdOn: new Date(),
          createdBy: user2._id,
          updatedOn: new Date(),
          updatedBy: user2._id,
          sections: {}
        }
      ];
      documents = [
        { _id: documentInputs[0].documentId, title: 'Document A' },
        { _id: documentInputs[1].documentId, title: 'Document B' }
      ];

      result = await sut.mapDocumentInputs({ documentInputs, documents });
    });

    it('should map documentInputs', () => {
      expect(result).toEqual([
        {
          ...documentInputs[0],
          documentTitle: 'Document A',
          createdOn: documentInputs[0].createdOn.toISOString(),
          createdBy: {
            _id: user1._id,
            displayName: user1.displayName
          },
          updatedOn: documentInputs[0].updatedOn.toISOString(),
          updatedBy: {
            _id: user1._id,
            displayName: user1.displayName
          },
          sections: {}
        },
        {
          ...documentInputs[1],
          documentTitle: 'Document B',
          createdOn: documentInputs[1].createdOn.toISOString(),
          createdBy: {
            _id: user2._id,
            displayName: user2.displayName
          },
          updatedOn: documentInputs[1].updatedOn.toISOString(),
          updatedBy: {
            _id: user2._id,
            displayName: user2.displayName
          },
          sections: {}
        }
      ]);
    });
  });
});
