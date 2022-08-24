import sut from './room-utils.js';
import { ROOM_DOCUMENTS_MODE } from '../domain/constants.js';

describe('room-utils', () => {

  describe('isRoomOwnerOrMember', () => {
    const testCases = [
      {
        description: 'when user is not room owner or member',
        room: { owner: 'other-user', members: [] },
        userId: 'my-user',
        expectedResult: false
      },
      {
        description: 'when user is room owner',
        room: { owner: 'my-user', members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user (with client mapped data model) is room owner',
        room: { owner: { key: 'my-user' }, members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user is room member',
        room: { owner: 'my-user', members: [] },
        userId: 'my-user',
        expectedResult: true
      }
    ];

    testCases.forEach(({ description, room, userId, expectedResult }) => {
      describe(description, () => {
        it(`should return ${expectedResult}`, () => {
          expect(sut.isRoomOwnerOrMember({ room, userId })).toBe(expectedResult);
        });
      });
    });
  });

  describe('isRoomOwnerOrCollaborator', () => {
    const testCases = [
      {
        description: 'when user is not room owner and room has exclusive documents mode',
        room: { documentsMode: ROOM_DOCUMENTS_MODE.exclusive, owner: 'other-user', members: [] },
        userId: 'my-user',
        expectedResult: false
      },
      {
        description: 'when user is room owner and room has exclusive documents mode',
        room: { documentsMode: ROOM_DOCUMENTS_MODE.exclusive, owner: 'my-user', members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user (with client mapped data model) is room owner and room has exclusive documents mode',
        room: { documentsMode: ROOM_DOCUMENTS_MODE.exclusive, owner: { key: 'my-user' }, members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user is not room collaborator',
        room: { documentsMode: ROOM_DOCUMENTS_MODE.collaborative, owner: 'other-user', members: [{ userId: 'yet-another-user' }] },
        userId: 'my-user',
        expectedResult: false
      },
      {
        description: 'when user is room collaborator',
        room: { documentsMode: ROOM_DOCUMENTS_MODE.collaborative, owner: 'other-user', members: [{ userId: 'my-user' }] },
        userId: 'my-user',
        expectedResult: true
      }
    ];

    testCases.forEach(({ description, room, userId, expectedResult }) => {
      describe(description, () => {
        it(`should return ${expectedResult}`, () => {
          expect(sut.isRoomOwnerOrCollaborator({ room, userId })).toBe(expectedResult);
        });
      });
    });
  });
});
