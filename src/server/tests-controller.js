import moment from 'moment';
import { ObjectId } from 'mongodb';
import Database from '../stores/database.js';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import { getDayOfWeek } from '../utils/date-utils.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class TestsController {
  static dependencies = [PageRenderer, DocumentService, RoomService, ClientDataMappingService, Database];

  constructor(pageRenderer, documentService, roomService, clientDataMappingService, database) {
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.roomService = roomService;
    this.clientDataMappingService = clientDataMappingService;
    this.database = database;
  }

  async handleGetTestsPage(req, res) {
    const { user } = req;

    const rooms = await this.roomService.getRoomsOwnedByUser(user?._id || 'hihi');
    const room = rooms[0] || null;

    let roomMediaContext;
    if (room) {
      const singleRoomMediaOverview = await this.roomService.getSingleRoomMediaOverview({ user, roomId: room._id });
      roomMediaContext = singleRoomMediaOverview.storagePlan || singleRoomMediaOverview.usedBytes
        ? {
          singleRoomMediaOverview,
          isDeletionEnabled: true
        }
        : null;
    } else {
      roomMediaContext = null;
    }

    const mappedRoom = room ? await this.clientDataMappingService.mapRoom({ room, viewingUser: user }) : null;
    const initialState = { room: mappedRoom, roomMediaContext };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.tests, initialState);
  }

  async handlePostCreateDocumentRequests(req, res) {
    const year = Number.parseInt(req.params.year, 10);
    await this.createTestDocumentRequests(year);
    return res.send({});
  }

  /* eslint-disable no-unreachable, no-console, no-promise-executor-return */
  async createTestDocumentRequests(year) {
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

    const ENTRIES_PER_DAY = 10000;
    const TEN_HOURS_IN_MS = 10 * 60 * 60 * 1000;

    const documents = await this.database.documents.find({ roomContext: null }, { projection: { _id: 1, revision: 1 } }).toArray();

    let dayCounter = 1;
    let eightOClock = moment({ year, hour: 8 });
    while (eightOClock.year() === year) {
      console.log(`[DAY ${dayCounter}]: ${eightOClock.format('L')}`);

      const recordsToInsert = [];

      for (let i = 0; i < ENTRIES_PER_DAY; i += 1) {
        const offset = getRandomInt(0, TEN_HOURS_IN_MS);
        const document = documents[getRandomInt(0, documents.length - 1)];
        const registeredOn = moment(eightOClock).add(offset, 'milliseconds').toDate();
        const registeredOnDayOfWeek = getDayOfWeek(registeredOn);
        recordsToInsert.push({
          _id: new ObjectId(),
          documentId: document._id,
          documentRevisionId: document.revision,
          isWriteRequest: getRandomInt(0, 5) === 5,
          isLoggedInRequest: getRandomInt(0, 3) !== 3,
          registeredOn,
          registeredOnDayOfWeek
        });
      }

      await this.database.documentRequests.insertMany(recordsToInsert);

      eightOClock = moment(eightOClock).add(1, 'day');
      dayCounter += 1;
    }
  }
  /* eslint-enable no-unreachable, no-console, no-promise-executor-return */

  registerPages(router) {
    router.get(
      '/tests',
      needsPermission(permissions.MANAGE_SETUP),
      (req, res) => this.handleGetTestsPage(req, res)
    );
  }

  registerApi(router) {
    router.post(
      '/api/v1/tests/create-document-requests/:year',
      needsPermission(permissions.MANAGE_SETUP),
      (req, res) => this.handlePostCreateDocumentRequests(req, res)
    );
  }
}

export default TestsController;
