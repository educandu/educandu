import routes from '../utils/routes.js';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import UserService from '../services/user-service.js';
import RoomService from '../services/room-service.js';
import { DASHBOARD_TAB_KEY } from '../domain/constants.js';
import DocumentService from '../services/document-service.js';
import NotificationService from '../services/notification-service.js';
import DocumentInputService from '../services/document-input-service.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class DashboardController {
  static dependencies = [UserService, RoomService, DocumentService, DocumentInputService, NotificationService, ClientDataMappingService, PageRenderer];

  constructor(userService, roomService, documentService, documentInputService, notificationService, clientDataMappingService, pageRenderer) {
    this.userService = userService;
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.notificationService = notificationService;
    this.documentInputService = documentInputService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetDashboardPage(req, res) {
    const { user } = req;

    const tabFromQuery = req.query.tab;
    if (tabFromQuery && !Object.values(DASHBOARD_TAB_KEY).includes(tabFromQuery)) {
      return res.redirect(301, routes.getDashboardUrl());
    }

    const initialTab = tabFromQuery || DASHBOARD_TAB_KEY.activities;

    const initialState = {
      initialTab,
      rooms: [],
      favorites: [],
      documents: [],
      activities: [],
      documentInputs: [],
      roomInvitations: [],
      notificationGroups: [],
      allRoomMediaOverview: null
    };

    if (initialTab === DASHBOARD_TAB_KEY.activities) {
      const activities = await this.userService.getActivities({ userId: user._id });
      const mappedActivities = await this.clientDataMappingService.mapUserActivities(activities);
      initialState.activities = mappedActivities;
    } else if (initialTab === DASHBOARD_TAB_KEY.favorites) {
      const favorites = await this.userService.getFavorites({ user });
      const mappedFavorites = await this.clientDataMappingService.mapUserFavorites(favorites, user);
      initialState.favorites = mappedFavorites;
    } else if (initialTab === DASHBOARD_TAB_KEY.documents) {
      const documents = await this.documentService.getPublicNonArchivedDocumentsByContributingUser(user._id);
      const mappedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(documents);
      initialState.documents = mappedDocuments;
    } else if (initialTab === DASHBOARD_TAB_KEY.rooms) {
      const rooms = await this.roomService.getRoomsOwnedOrJoinedByUser(user._id);
      const invitations = await this.roomService.getRoomInvitationsByEmail(user.email);
      const mappedRooms = await Promise.all(rooms.map(room => this.clientDataMappingService.mapRoom({ room, viewingUser: user })));
      const mappedInvitations = await Promise.all(invitations.map(invitation => this.clientDataMappingService.mapUserOwnRoomInvitations(invitation)));
      initialState.rooms = mappedRooms;
      initialState.roomInvitations = mappedInvitations;
    } else if (initialTab === DASHBOARD_TAB_KEY.documentInputs) {
      const documentInputs = await this.documentInputService.getAllDocumentInputsCreatedByUser(user._id);
      const documentIds = documentInputs.map(input => input.documentId);
      const documents2 = await this.documentService.getDocumentsMetadataByIds(documentIds);
      const mappedDocumentInputs = await this.clientDataMappingService.mapDocumentInputs({ documentInputs, documents: documents2 });
      initialState.documentInputs = mappedDocumentInputs;
    } else if (initialTab === DASHBOARD_TAB_KEY.notifications) {
      const notificationGroups = await this.notificationService.getNotificationGroups({ user });
      const mappedNotificationGroups = await this.clientDataMappingService.mapUserNotificationGroups(notificationGroups, user);
      initialState.notificationGroups = mappedNotificationGroups;
    } else if (initialTab === DASHBOARD_TAB_KEY.storage) {
      const allRoomMediaOverview = await this.roomService.getAllRoomMediaOverview({ user });
      const mappedAllRoomMediaOverview = await this.clientDataMappingService.mapAllRoomMediaOverview(allRoomMediaOverview, user);
      initialState.allRoomMediaOverview = mappedAllRoomMediaOverview;
    } else if (initialTab === DASHBOARD_TAB_KEY.settings) {
      // No data loading needed for settings tab
    } else {
      throw new Error(`Invalid dashboard tab key: '${initialTab}'`);
    }

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.dashboard, initialState);
  }

  registerPages(router) {
    router.get(
      '/dashboard',
      needsAuthentication(),
      (req, res) => this.handleGetDashboardPage(req, res)
    );
  }
}

export default DashboardController;
