import permissions, { hasUserPermission } from '../domain/permissions.js';

class MediaTrashController {
  handleAuthorizeResourcesAccess(req, res) {
    const { user } = req;
    if (!user) {
      return res.status(401).end();
    }

    const userHasPermission = hasUserPermission(user, permissions.MANAGE_DELETED_PUBLIC_CONTENT);
    return res.status(userHasPermission ? 200 : 403).end();
  }

  registerApi(router) {
    router.get(
      '/api/v1/media-trash/items/authorize-resources-access',
      (req, res) => this.handleAuthorizeResourcesAccess(req, res)
    );
  }
}

export default MediaTrashController;
