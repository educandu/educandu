import RoomService from './room-service.js';
import { setupTestEnvironment } from '../test-helper.js';
import { ROOM_ACCESS_LEVEL } from '../common/constants.js';

describe('room-service', () => {
  let sut;

  let container;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(RoomService);
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
