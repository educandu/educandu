import Logger from '../common/logger';
import uniqueId from '../utils/unique-id';
import dateTime from '../utils/date-time';
import MenuStore from '../stores/menu-store';
import MenuLockStore from '../stores/menu-lock-store';

const logger = new Logger(__filename);

class MenuService {
  static get inject() { return [MenuStore, MenuLockStore]; }

  constructor(menuStore, menuLockStore) {
    this.menuStore = menuStore;
    this.menuLockStore = menuLockStore;
  }

  getMenus() {
    return this.menuStore.find({}, { sort: [['createdOn', 1]] });
  }

  getMenuById(menuId) {
    return this.menuStore.findOne({ _id: menuId });
  }

  getMenuBySlug(slug) {
    return this.menuStore.findOne({ slug });
  }

  async saveMenu({ menu, user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    let lock;
    const now = dateTime.now();
    const menuId = menu._id || uniqueId.create();

    try {

      logger.info('Creating new menu with id %s', menuId);

      lock = await this.menuLockStore.takeLock(menuId);

      let existingMenu = await this.getMenuById(menuId);
      if (existingMenu) {
        logger.info('Found existing menu with id %s', menuId);
      } else {
        logger.info('No existing menu found with id %s', menuId);
      }

      if (!existingMenu) {
        existingMenu = {
          _id: menuId,
          createdOn: now,
          createdBy: { id: user._id }
        };
      }

      const updatedMenu = {
        _id: menuId,
        title: menu.title || '',
        slug: menu.slug || null,
        createdOn: existingMenu ? existingMenu.createdOn : now,
        updatedOn: now,
        createdBy: existingMenu ? existingMenu.createdBy : { id: user._id },
        updatedBy: { id: user._id },
        defaultDocumentKey: menu.defaultDocumentKey || null,
        nodes: menu.nodes || []
      };

      logger.info('Saving menu with id %s', updatedMenu._id);
      await this.menuStore.save(updatedMenu);

      return updatedMenu;

    } finally {
      if (lock) {
        await this.menuLockStore.releaseLock(lock);
      }
    }
  }
}

export default MenuService;
