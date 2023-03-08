import { describe, expect, it } from 'vitest';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator, isRoomOwnerOrInvitedMember } from './room-utils.js';

describe('room-utils', () => {

  describe('isRoomOwner', () => {
    const testCases = [
      {
        description: 'when user is room owner',
        room: { owner: 'my-user', members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user (with client mapped data model) is room owner',
        room: { owner: { _id: 'my-user' }, members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user is room member but not owner',
        room: { owner: 'other-user', members: [{ userId: 'my-user' }] },
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
        room: { owner: { _id: 'my-user' }, members: [] },
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
          expect(isRoomOwnerOrInvitedMember({ room, userId })).toBe(expectedResult);
        });
      });
    });
  });

  describe('isRoomOwnerOrInvitedCollaborator', () => {
    const testCases = [
      {
        description: 'when user is not room owner and room is not collaborative',
        room: { isCollaborative: false, owner: 'other-user', members: [] },
        userId: 'my-user',
        expectedResult: false
      },
      {
        description: 'when user is room owner and room is not collaborative',
        room: { isCollaborative: false, owner: 'my-user', members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user (with client mapped data model) is room owner and room is not collaborative',
        room: { isCollaborative: false, owner: { _id: 'my-user' }, members: [] },
        userId: 'my-user',
        expectedResult: true
      },
      {
        description: 'when user is not room collaborator',
        room: { isCollaborative: true, owner: 'other-user', members: [{ userId: 'yet-another-user' }] },
        userId: 'my-user',
        expectedResult: false
      },
      {
        description: 'when user is room collaborator',
        room: { isCollaborative: true, owner: 'other-user', members: [{ userId: 'my-user' }] },
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
