const uniqueId = require('../utils/unique-id');
const dateTime = require('../utils/date-time');
const MenuStore = require('../stores/menu-store');
const MenuLockStore = require('../stores/menu-lock-store');

class MenuService {
  static get inject() { return [MenuStore, MenuLockStore]; }

  constructor(menuStore, menuLockStore) {
    this.menuStore = menuStore;
    this.menuLockStore = menuLockStore;
  }

  getMenus() {
    return this.menuStore.find({
      sort: [['createdOn', 1]]
    });
  }

  getMenuById(menuId) {
    return this.menuStore.findOne({
      query: { _id: menuId }
    });
  }

  getMenuBySlug(slug) {
    return this.menuStore.findOne({
      query: { slug }
    });
  }

  async saveMenu({ menu, user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    const now = dateTime.now();
    const menuId = menu._id || uniqueId.create();

    await this.menuLockStore.takeLock(menuId);

    let existingMenu = await this.getMenuById(menuId);

    if (!this.userCanUpdateMenu(existingMenu, menu, user)) {
      throw new Error('The user does not have permission to update the menu');
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

    await this.menuStore.save(updatedMenu);

    await this.menuLockStore.releaseLock(menuId);

    return updatedMenu;
  }

  /* eslint-disable-next-line no-unused-vars */
  userCanUpdateMenu(existingMenu, newMenu, user) {
    return true;
  }

  async deleteMenu({ menuId }) {
    await this.menuLockStore.takeLock(menuId);
    await this.menuStore.deleteOne({ _id: menuId });
    await this.menuLockStore.releaseLock(menuId);
  }
}

module.exports = MenuService;
