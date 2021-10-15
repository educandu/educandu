/* eslint-disable no-await-in-loop */
import Logger from '../common/logger';
import uniqueId from '../utils/unique-id';
import dateTime from '../utils/date-time';
import MenuStore from '../stores/menu-store';
import DocumentService from './document-service';
import MenuLockStore from '../stores/menu-lock-store';

const logger = new Logger(__filename);

class MenuService {
  static get inject() { return [MenuStore, MenuLockStore, DocumentService]; }

  constructor(menuStore, menuLockStore, documentService) {
    this.menuStore = menuStore;
    this.menuLockStore = menuLockStore;
    this.documentService = documentService;
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

  async createMarkdownContentFromNodes(nodes, level, lines = []) {
    for (const node of nodes) {
      if (node.title) {
        lines.push(`###${'#'.repeat(level)} ${node.title}`);
        lines.push('');
      }

      if (node.documentKeys.length) {
        for (const documentKey of node.documentKeys) {
          const document = await this.documentService.getDocumentByKey(documentKey);
          const documentUrl = `/${document.namespace}/${encodeURIComponent(document.slug)}`;
          lines.push(`* [${document.title}](${documentUrl})`);
        }
        lines.push('');
      }

      if (node.children.length) {
        await this.createMarkdownContentFromNodes(node.children, level + 1, lines);
      }
    }

    return lines.join('\n').trimEnd();
  }

  async deleteMenus({ user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    try {
      const menus = await this.menuStore.find({});
      for (const menu of menus) {
        logger.info(`-----Migrating menu ${menu._id} titled '${menu.title}'-----`);
        let latestDocumentRevision;

        if (menu.defaultDocumentKey) {
          logger.info(`Case 1: has document ${menu.defaultDocumentKey}`);
          latestDocumentRevision = await this.documentService.getCurrentDocumentRevisionByKey(menu.defaultDocumentKey);
        } else {
          const firstDoc = {
            title: '',
            slug: '',
            namespace: 'articles',
            language: 'de',
            sections: []
          };
          latestDocumentRevision = await this.documentService.createDocumentRevision({ doc: firstDoc, user });
          logger.info(`Case 2: new document created ${latestDocumentRevision.key}`);
        }

        const newDoc = {
          title: menu.title,
          slug: `menu-${menu.slug}`,
          namespace: latestDocumentRevision.namespace,
          language: latestDocumentRevision.language,
          sections: latestDocumentRevision.sections,
          appendTo: {
            key: latestDocumentRevision.key,
            ancestorId: latestDocumentRevision._id
          }
        };

        if (menu.title) {
          const newTopSection = {
            key: uniqueId.create(),
            type: 'markdown',
            content: {
              text: `## ${menu.title}`
            }
          };

          newDoc.sections = [newTopSection, ...newDoc.sections];
        }

        if (menu.nodes.length) {
          logger.info(`Migrating ${menu.nodes.length} nodes`);
          const markdownText = await this.createMarkdownContentFromNodes(menu.nodes, 0);
          newDoc.sections.push({
            key: uniqueId.create(),
            type: 'markdown',
            content: {
              text: markdownText
            }
          });
        }
        const newDocumentRevision = await this.documentService.createDocumentRevision({ doc: newDoc, user });
        logger.info(`New revision ${newDocumentRevision._id} for document ${newDocumentRevision.key}`);
        logger.info('Done');
      }
    } catch (error) {
      logger.error('Something went terribly wrong', error);
    }

  }
}

export default MenuService;
