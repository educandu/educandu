import RoomService from './room-service.js';
import { ROOM_ACCESS_LEVEL } from '../common/constants.js';
import { destroyTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('room-service', () => {
  let container;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(RoomService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('createRoom', () => {
    let createdRoom;
    beforeEach(async () => {
      createdRoom = await sut.createRoom({ name: 'my room', owner: 'abc', access: ROOM_ACCESS_LEVEL.public });
    });

    it('should create a room', async () => {
      expect(createdRoom).toEqual({
        _id: expect.stringMatching(/\w+/),
        name: 'my room',
        owner: 'abc',
        access: ROOM_ACCESS_LEVEL.public,
        members: []
      });
    });

    describe('when retrieving the room', () => {
      it('should retrieve the room', async () => {
        const retrievedRoom = await sut.getRoomById(createdRoom._id);
        expect(retrievedRoom).toEqual(createdRoom);
      });
    });
  });
});
