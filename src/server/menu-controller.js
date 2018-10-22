const treeCrawl = require('tree-crawl');
const bodyParser = require('body-parser');
const PageRenderer = require('./page-renderer');
const Menu = require('../components/pages/menu.jsx');
const permissions = require('../domain/permissions');
const Menus = require('../components/pages/menus.jsx');
const MenuService = require('../services/menu-service');
const ClientDataMapper = require('./client-data-mapper');
const EditMenu = require('../components/pages/edit-menu.jsx');
const DocumentService = require('../services/document-service');
const needsPermission = require('../domain/needs-permission-middleware');

function visitMenuNodes(nodes, cb) {
  nodes.forEach(rootNode => treeCrawl(rootNode, cb, { getChildren: node => node.children }));
}

const jsonParser = bodyParser.json();

class MenuController {
  static get inject() { return [MenuService, DocumentService, ClientDataMapper, PageRenderer]; }

  constructor(menuService, documentService, clientDataMapper, pageRenderer) {
    this.menuService = menuService;
    this.documentService = documentService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerPages(app) {
    app.get('/menus/:slug', async (req, res) => {
      const menu = await this.menuService.getMenuBySlug(req.params.slug);
      if (!menu) {
        return res.sendStatus(404);
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
        ...this.clientDataMapper.mapDocsMetadataToInitialState({ docs }),
        defaultDocument: defaultDocument ? this.clientDataMapper.mapDocToInitialState({ doc: defaultDocument }) : null
      };
      return this.pageRenderer.sendPage(req, res, 'menu', Menu, initialState);
    });

    app.get('/menus', needsPermission(permissions.VIEW_MENUS), async (req, res) => {
      const initialState = await this.menuService.getMenus();
      return this.pageRenderer.sendPage(req, res, 'menus', Menus, initialState);
    });

    app.get('/edit/menu/:menuId', needsPermission(permissions.EDIT_MENU), async (req, res) => {
      const menu = await this.menuService.getMenuById(req.params.menuId);
      if (!menu) {
        return res.sendStatus(404);
      }

      const docs = await this.documentService.getDocumentsMetadata();

      const initialState = {
        ...this.clientDataMapper.mapMenuToInitialState({ menu }),
        ...this.clientDataMapper.mapDocsMetadataToInitialState({ docs })
      };
      return this.pageRenderer.sendPage(req, res, 'edit-menu', EditMenu, initialState);
    });
  }

  registerApi(app) {
    app.post('/api/v1/menus', [needsPermission(permissions.EDIT_MENU), jsonParser], async (req, res) => {
      const user = req.user;
      const menu = req.body;
      const updatedMenu = await this.menuService.saveMenu({ menu, user });
      const initialState = this.clientDataMapper.mapMenuToInitialState({ menu: updatedMenu });
      return res.send(initialState);
    });
  }
}

module.exports = MenuController;
