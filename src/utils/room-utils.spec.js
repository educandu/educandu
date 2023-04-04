import { describe, expect, it } from 'vitest';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator, isRoomOwnerOrInvitedMember } from './room-utils.js';

describe('room-utils', () => {

  describe('isRoomOwner', () => {
    const testCases = [
      {
        description: 'when user is room owner',
        room: { ownedBy: 'my-user', members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user is room member but not owner',
        room: { ownedBy: 'other-user', members: [{ userId: 'my-user' }] },
        userId: 'my-user',
        expectedResult: false
      }
    ];

    testCases.forEach(({ description, room, userId, expectedResult }) => {
      describe(description, () => {
        it(`should return ${expectedResult}`, () => {
          expect(isRoomOwner({ room, userId })).toBe(expectedResult);
        });
      });
    });
  });

  describe('isRoomOwnerOrInvitedMember', () => {
    const testCases = [
      {
        description: 'when user is not room owner or member',
        room: { ownedBy: 'other-user', members: [] },
        userId: 'my-user',
        expectedResult: false
      },
      {
        description: 'when user is room owner',
        room: { ownedBy: 'my-user', members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user is room member',
        room: { ownedBy: 'my-user', members: [] },
        userId: 'my-user',
        expectedResult: true
      }
    ];

    testCases.forEach(({ description, room, userId, expectedResult }) => {
      describe(description, () => {
        it(`should return ${expectedResult}`, () => {
          expect(isRoomOwnerOrInvitedMember({ room, userId })).toBe(expectedResult);
        });
      });
    });
  });

  describe('isRoomOwnerOrInvitedCollaborator', () => {
    const testCases = [
      {
        description: 'when user is not room owner and room is not collaborative',
        room: { isCollaborative: false, ownedBy: 'other-user', members: [] },
        userId: 'my-user',
        expectedResult: false
      },
      {
        description: 'when user is room owner and room is not collaborative',
        room: { isCollaborative: false, ownedBy: 'my-user', members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user is not room collaborator',
        room: { isCollaborative: true, ownedBy: 'other-user', members: [{ userId: 'yet-another-user' }] },
        userId: 'my-user',
        expectedResult: false
      },
      {
        description: 'when user is room collaborator',
        room: { isCollaborative: true, ownedBy: 'other-user', members: [{ userId: 'my-user' }] },
        userId: 'my-user',
        expectedResult: true
      }
    ];

    testCases.forEach(({ description, room, userId, expectedResult }) => {
      describe(description, () => {
        it(`should return ${expectedResult}`, () => {
          expect(isRoomOwnerOrInvitedCollaborator({ room, userId })).toBe(expectedResult);
        });
      });
    });
  });
});
