import urls from '../utils/routes.js';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { ROOM_ACCESS } from '../domain/constants.js';
import RoomService from '../services/room-service.js';
import { isRoomOwnerOrMember } from '../utils/room-utils.js';
import DocumentService from '../services/document-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

const { NotFound, Forbidden } = httpErrors;

class RevisionController {
  static get inject() { return [DocumentService, RoomService, ClientDataMappingService, PageRenderer]; }

  constructor(documentService, roomService, clientDataMappingService, pageRenderer) {
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
  }

  handleGetArticlePage(req, res) {
    res.redirect(301, urls.getDocumentRevisionUrl(req.params.id));
  }

  async handleGetRevisionPage(req, res) {
    const { user } = req;
    const revision = await this.documentService.getDocumentRevisionById(req.params.id);

    if (!revision) {
      throw new NotFound();
    }

    const room = revision.roomId ? await this.roomService.getRoomById(revision.roomId) : null;

    if (room?.access === ROOM_ACCESS.private && !isRoomOwnerOrMember({ room, userId: user?._id })) {
      throw new Forbidden();
    }

    const mappedRevision = await this.clientDataMappingService.mapDocOrRevision(revision, req.user);
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.revision, { revision: mappedRevision });
  }

  registerPages(router) {
    router.get(
      '/revs/articles/:id',
      (req, res) => this.handleGetArticlePage(req, res)
    );

    router.get(
      '/revs/:id',
      (req, res) => this.handleGetRevisionPage(req, res)
    );
  }
}

export default RevisionController;
