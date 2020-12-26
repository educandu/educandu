import express from 'express';
import treeCrawl from 'tree-crawl';
import { NotFound } from 'http-errors';
import PageRenderer from './page-renderer';
import permissions from '../domain/permissions';
import privateData from '../domain/private-data';
import MenuService from '../services/menu-service';
import ClientDataMapper from './client-data-mapper';
import DocumentService from '../services/document-service';
import needsPermission from '../domain/needs-permission-middleware';

function visitMenuNodes(nodes, cb) {
  nodes.forEach(rootNode => treeCrawl(rootNode, cb, { getChildren: node => node.children }));
}

const jsonParser = express.json();

class MenuController {
  static get inject() { return [MenuService, DocumentService, ClientDataMapper, PageRenderer]; }

  constructor(menuService, documentService, clientDataMapper, pageRenderer) {
    this.menuService = menuService;
    this.documentService = documentService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerPages(router) {
    router.get('/menus/:slug', async (req, res) => {
      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const menu = await this.menuService.getMenuBySlug(req.params.slug);
      if (!menu) {
        throw new NotFound();
      }

      const defaultDocument = menu.defaultDocumentKey
        ? await this.documentService.getDocumentById(menu.defaultDocumentKey)
        : null;

      const docKeys = new Set();
      docKeys.add(menu.defaultDocumentKey);
      visitMenuNodes(menu.nodes, node => (node.documentKeys || []).forEach(key => docKeys.add(key)));

      const docs = await this.documentService.getDocumentsMetadata(Array.from(docKeys));

      const initialState = {
        ...this.clientDataMapper.mapMenuToInitialState({ menu }),
        ...this.clientDataMapper.mapDocsMetadataToInitialState({ docs, allowedUserFields }),
        defaultDocument: defaultDocument ? this.clientDataMapper.mapDocToInitialState({ doc: defaultDocument, allowedUserFields: allowedUserFields }) : null
      };
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'menu', initialState);
    });

    router.get('/menus', needsPermission(permissions.VIEW_MENUS), async (req, res) => {
      const initialState = await this.menuService.getMenus();
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'menus', initialState);
    });

    router.get('/edit/menu/:menuId', needsPermission(permissions.EDIT_MENU), async (req, res) => {
      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const menu = await this.menuService.getMenuById(req.params.menuId);
      if (!menu) {
        throw new NotFound();
      }

      const docs = await this.documentService.getDocumentsMetadata();

      const initialState = {
        ...this.clientDataMapper.mapMenuToInitialState({ menu }),
        ...this.clientDataMapper.mapDocsMetadataToInitialState({ docs, allowedUserFields })
      };
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'edit-menu', initialState);
    });
  }

  registerApi(router) {
    router.post('/api/v1/menus', [needsPermission(permissions.EDIT_MENU), jsonParser], async (req, res) => {
      const user = req.user;
      const menu = req.body;
      const updatedMenu = await this.menuService.saveMenu({ menu, user });
      const initialState = this.clientDataMapper.mapMenuToInitialState({ menu: updatedMenu });
      return res.send(initialState);
    });
  }
}

export default MenuController;
