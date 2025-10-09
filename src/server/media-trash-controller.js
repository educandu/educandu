import { validateParams } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import MediaLibraryService from '../services/media-library-service.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { mediaTrashItemIdParamsSchema } from '../domain/schemas/media-trash-item-schemas.js';

class MediaTrashController {
  static dependencies = [MediaLibraryService, ClientDataMappingService];

  constructor(mediaLibraryService, clientDataMappingService) {
    this.mediaLibraryService = mediaLibraryService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetMediaTrashItemsForContentManagement(req, res) {
    const { user } = req;

    const mediaTrashItems = await this.mediaLibraryService.getAllMediaTrashItemsWithUsage();
    const mappedMediaTrashItems = await this.clientDataMappingService.mapMediaTrashItems(mediaTrashItems, user);

    return res.send({ mediaTrashItems: mappedMediaTrashItems });
  }

  handleAuthorizeResourcesAccess(req, res) {
    const { user } = req;
    if (!user) {
      return res.status(401).end();
    }

    const userHasPermission = hasUserPermission(user, permissions.MANAGE_DELETED_PUBLIC_CONTENT);
    return res.status(userHasPermission ? 200 : 403).end();
  }

  async handleDeleteMediaTrashItem(req, res) {
    const { mediaTrashItemId } = req.params;

    await this.mediaLibraryService.deleteMediaTrashItem({ mediaTrashItemId });
    return res.status(204).end();
  }

  registerApi(router) {
    router.get(
      '/api/v1/media-trash/items/content-management',
      needsPermission(permissions.MANAGE_DELETED_PUBLIC_CONTENT),
      (req, res) => this.handleGetMediaTrashItemsForContentManagement(req, res)
    );

    router.get(
      '/api/v1/media-trash/items/authorize-resources-access',
      (req, res) => this.handleAuthorizeResourcesAccess(req, res)
    );

    router.delete(
      '/api/v1/media-trash/items/:mediaTrashItemId',
      needsPermission(permissions.MANAGE_DELETED_PUBLIC_CONTENT),
      validateParams(mediaTrashItemIdParamsSchema),
      (req, res) => this.handleDeleteMediaTrashItem(req, res)
    );
  }
}

export default MediaTrashController;
