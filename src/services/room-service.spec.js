import { afterAll } from '@jest/globals';
import RoomService from './room-service.js';
import { ROOM_ACCESS_LEVEL } from '../common/constants.js';
import { destroyTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('room-service', () => {
  let sut;

  let container;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(RoomService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('createRoom', () => {
    it('should create a room', async () => {
      const result = await sut.createRoom({ name: 'my room', owner: 'abc', access: ROOM_ACCESS_LEVEL.public });

      expect(result).toEqual({
        _id: expect.stringMatching(/\w+/),
        name: 'my room',
        owner: 'abc',
        access: ROOM_ACCESS_LEVEL.public,
        members: []
      });
    });
  });
});
