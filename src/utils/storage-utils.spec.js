import { stub } from 'sinon';
import uniqueId from './unique-id.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import {
  getStorageLocationTypeForPath,
  getRoomMediaRoomPath,
  tryGetRoomIdFromStoragePath,
  createUniqueStorageFileName,
  getPrivateStorageOverview
} from './storage-utils.js';

describe('storage-utils', () => {
  describe('getStorageLocationTypeForPath', () => {
    const testCases = [
      { path: 'root/media-library/resourceId/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: 'mediatech/resourceId/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: 'media-library/resourceId/', expectedResult: STORAGE_LOCATION_TYPE.mediaLibrary },
      { path: '/root/room-media/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: '/room-media/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: '/root/room-media/roomId', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: 'room-media/roomId', expectedResult: STORAGE_LOCATION_TYPE.roomMedia }
    ];

    testCases.forEach(({ path, expectedResult }) => {
      it(`should return '${expectedResult}' for '${path}'`, () => {
        const actualResult = getStorageLocationTypeForPath(path);
        expect(actualResult).toBe(expectedResult);
      });
    });
  });

  describe('getRoomMediaRoomPath', () => {
    it('should return the path', () => {
      expect(getRoomMediaRoomPath('myRoom')).toBe('room-media/myRoom');
    });
  });

  describe('tryGetRoomIdFromStoragePath', () => {
    it('should return the room id when the path is valid', () => {
      expect(tryGetRoomIdFromStoragePath('room-media/myRoom')).toBe('myRoom');
    });

    it('should return null when the path is invalid', () => {
      expect(tryGetRoomIdFromStoragePath('root/room-media/myRoom')).toBe(null);
    });
  });

  describe('createUniqueStorageFileName', () => {
    const generateId = () => 'ch5zQo897tzo8f3';
    const testCases = [
      { fileName: 'hello-world-123.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'hello-world-123.MP3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'hello_world_123.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'hello world 123.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'héllö wøȑlð 123.mp3', expectedResult: 'helloe-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'Hällo Wörld 123.mp3', expectedResult: 'haello-woerld-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: '### ###.mp3', expectedResult: 'ch5zQo897tzo8f3.mp3' }
    ];

    testCases.forEach(({ fileName, expectedResult }) => {
      it(`should transform fileName '${fileName} to '${expectedResult}'`, () => {
        const actualResult = createUniqueStorageFileName(fileName, generateId);
        expect(actualResult).toBe(expectedResult);
      });
    });
  });

  describe('getPrivateStorageOverview', () => {
    let user;
    let rooms;
    let result;
    let storagePlan;
    let room1MediaItems;
    let room2MediaItems;
    let documentInputId;
    let room1MediaInputItems;
    let room2MediaInputItems;

    beforeEach(async () => {
      documentInputId = uniqueId.create();

      const roomMediaItemStore = {
        getAllRoomMediaItemsByRoomId: stub()
      };
      const storagePlanStore = {
        getStoragePlanById: stub()
      };
      const roomStore = {
        getRoomsByOwnerUserId: stub()
      };
      const documentInputMediaItemStore = {
        getAllDocumentInputMediaItemByRoomId: stub()
      };

      storagePlan = {
        _id: uniqueId.create(),
        maxBytes: 500
      };

      user = {
        email: 'i@myself.com',
        displayName: 'Me',
        storage: {
          planId: storagePlan._id,
          usedBytes: 90
        }
      };

      rooms = [
        { _id: uniqueId.create(), name: 'Room 1', ownedBy: user._id },
        { _id: uniqueId.create(), name: 'Room 2', ownedBy: user._id }
      ];

      room1MediaItems = [
        {
          _id: uniqueId.create(),
          documentInputId,
          size: 10,
          url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
        },
        {
          _id: uniqueId.create(),
          documentInputId,
          size: 20,
          url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/boat-trips-KIoLnzk8NNwbxRWTHXmoI7.png'
        }
      ];

      room2MediaItems = [
        {
          _id: uniqueId.create(),
          size: 30,
          url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
        }
      ];

      room1MediaInputItems = [];
      room2MediaInputItems = [
        {
          _id: uniqueId.create(),
          documentInputId,
          size: 50,
          url: 'cdn://document-input-media/dD6coNQoTsK8pgmy94P83g/UtzL4CqWGfoptve6Ddkazn/some-file-UtzL4CqWGfoptve6Ddkazn.png'
        }
      ];

      roomStore.getRoomsByOwnerUserId.resolves(rooms);
      storagePlanStore.getStoragePlanById.resolves(storagePlan);
      roomMediaItemStore.getAllRoomMediaItemsByRoomId.withArgs(rooms[0]._id).resolves(room1MediaItems);
      roomMediaItemStore.getAllRoomMediaItemsByRoomId.withArgs(rooms[1]._id).resolves(room2MediaItems);
      documentInputMediaItemStore.getAllDocumentInputMediaItemByRoomId.withArgs(rooms[0]._id).resolves(room1MediaInputItems);
      documentInputMediaItemStore.getAllDocumentInputMediaItemByRoomId.withArgs(rooms[1]._id).resolves(room2MediaInputItems);

      result = await getPrivateStorageOverview({
        user,
        roomStore,
        storagePlanStore,
        roomMediaItemStore,
        documentInputMediaItemStore
      });
    });

    it('should return the private storage overview', () => {
      const usedBytes = room1MediaItems.reduce((accu, item) => accu + item.size, 0)
        + room2MediaItems.reduce((accu, item) => accu + item.size, 0)
        + room1MediaInputItems.reduce((accu, item) => accu + item.size, 0)
        + room2MediaInputItems.reduce((accu, item) => accu + item.size, 0);

      expect(result).toEqual({
        storagePlan,
        usedBytes,
        roomStorageList: [
          {
            roomId: rooms[0]._id,
            roomMediaItems: room1MediaItems,
            roomName: rooms[0].name,
            roomMediaPath: `room-media/${rooms[0]._id}`,
            usedBytesByDocumentInputMediaItems: 0,
            usedBytesByRoomMediaItems: 30,
            usedBytesPerDocumentInput: {}
          },
          {
            roomId: rooms[1]._id,
            roomMediaItems: room2MediaItems,
            roomName: rooms[1].name,
            roomMediaPath: `room-media/${rooms[1]._id}`,
            usedBytesByDocumentInputMediaItems: 50,
            usedBytesByRoomMediaItems: 30,
            usedBytesPerDocumentInput: {
              [documentInputId]: 50
            }
          }
        ]
      });
    });
  });
});
