import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import DocumentService from '../services/document-service.js';
import { isRoomOwnerOrInvitedMember } from '../utils/room-utils.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

const { NotFound, Forbidden } = httpErrors;

class ComparisonController {
  static dependencies = [DocumentService, RoomService, ClientDataMappingService, PageRenderer];

  constructor(documentService, roomService, clientDataMappingService, pageRenderer) {
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetRevisionComparisonPage(req, res) {
    const { user } = req;
    const { documentId } = req.params;
    const { oldId, newId } = req.query;

    const revisions = await this.documentService.getAllDocumentRevisionsByDocumentId(documentId);
    if (!revisions.length) {
      throw new NotFound();
    }

    const lastRevision = revisions[revisions.length - 1];
    const room = lastRevision.roomId ? await this.roomService.getRoomById(lastRevision.roomId) : null;
    if (room && !isRoomOwnerOrInvitedMember({ room, userId: user?._id })) {
      throw new Forbidden();
    }

    if (!revisions.some(rev => rev._id === oldId) || !revisions.some(rev => rev._id === newId)) {
      throw new NotFound();
    }

    const mappedRevisions = await this.clientDataMappingService.mapDocsOrRevisions(revisions, req.user);
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.comparison, { revisions: mappedRevisions });
  }

  registerPages(router) {
    router.get(
      '/comparison/:documentId',
      (req, res) => this.handleGetRevisionComparisonPage(req, res)
    );
  }
}

export default ComparisonController;
