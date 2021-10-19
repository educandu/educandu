/* eslint-disable no-await-in-loop */
import Logger from '../common/logger';
import uniqueId from '../utils/unique-id';
import dateTime from '../utils/date-time';
import MenuStore from '../stores/menu-store';
import DocumentService from './document-service';
import DocumentStore from '../stores/document-store';
import MenuLockStore from '../stores/menu-lock-store';
import DocumentLockStore from '../stores/document-lock-store';
import DocumentRevisionStore from '../stores/document-revision-store';

const logger = new Logger(__filename);

class MenuService {
  static get inject() { return [MenuStore, MenuLockStore, DocumentService, DocumentStore, DocumentRevisionStore, DocumentLockStore]; }

  constructor(menuStore, menuLockStore, documentService, documentStore, documentRevisionStore, documentLockStore) {
    this.menuStore = menuStore;
    this.menuLockStore = menuLockStore;
    this.documentService = documentService;
    this.documentStore = documentStore;
    this.documentRevisionStore = documentRevisionStore;
    this.documentLockStore = documentLockStore;
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

  async migrateMenu(menu, user, logHistory) {
    logHistory.push(`-----Migrating menu ${menu._id} titled '${menu.title}'-----`);
    let latestDocumentRevision;

    if (menu.defaultDocumentKey) {
      logHistory.push(`Case 1: has document ${menu.defaultDocumentKey}`);
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
      logHistory.push(`Case 2: new document created ${latestDocumentRevision.key}`);
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
      logHistory.push(`Migrating ${menu.nodes.length} nodes`);
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
    logHistory.push(`New revision ${newDocumentRevision._id} for document ${newDocumentRevision.key}`);
  }

  async updateDocumentRevisions(documentKey, logHistory) {
    let lock;

    try {
      lock = await this.documentLockStore.takeLock(documentKey);
      const documentRevisions = await this.documentService.getAllDocumentRevisionsByKey(documentKey);

      documentRevisions.forEach(documentRevision => {
        documentRevision.sections
          .filter(section => section.content?.tiles)
          .forEach(section => {
            section.content?.tiles
              .filter(tile => tile.link?.type === 'menu')
              .forEach(tile => {
                logHistory.push(`Document ${documentKey}, document revision ${documentRevision._id}, section ${section.key}, section revision ${section.revision} updated.`);
                tile.link.type = 'article';
                if (tile.link.url) {
                  tile.link.url = `menu-${tile.link.url}`;
                }
              });
          });
      });

      await this.documentRevisionStore.saveMany(documentRevisions);
      const latestDocument = this.documentService._createDocumentFromRevisions(documentRevisions);

      logHistory.push(`Document ${latestDocument.key}, document revision ${latestDocument.revision} - SAVED`);
      await this.documentStore.save(latestDocument);
    } catch (error) {
      logger.error(error);
      logHistory.push(error);
    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }

  async deleteMenus({ user }) {
    const logHistory = [];
    if (!user || !user._id) {
      logHistory.push('No user specified');
      return logHistory;
    }

    try {
      const menus = await this.menuStore.find({});

      for (const menu of menus) {
        await this.migrateMenu(menu, user, logHistory);
      }

      const filteredDocumentRevisions = await this.documentRevisionStore.find({ 'sections.content.tiles.link.type': 'menu' });
      const documentKeys = filteredDocumentRevisions.reduce((accu, currentRevision) => {
        accu.add(currentRevision.key);
        return accu;
      }, new Set());

      for (const documentKey of documentKeys) {
        await this.updateDocumentRevisions(documentKey, logHistory);
      }

      logHistory.push('Done');
    } catch (error) {
      logHistory.push('Something went terribly wrong', error);
    }

    return logHistory;
  }
}

export default MenuService;
