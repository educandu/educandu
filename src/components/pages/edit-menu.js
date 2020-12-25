/* eslint max-lines: off */

const React = require('react');
const { Input } = require('antd');
const Page = require('../page');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const treeCrawl = require('tree-crawl');
const urls = require('../../utils/urls');
const classnames = require('classnames');
const MenuTree = require('../menu-tree');
const Logger = require('../../common/logger');
const MenuDocRef = require('../menu-doc-ref');
const uniqueId = require('../../utils/unique-id');
const cloneDeep = require('../../utils/clone-deep');
const errorHelper = require('../../ui/error-helper');
const { inject } = require('../container-context');
const CheckPermissions = require('../check-permissions');
const MenuApiClient = require('../../services/menu-api-client');
const { EDIT_MENU_STRUCTURE } = require('../../domain/permissions');
const { SaveOutlined, CloseOutlined } = require('@ant-design/icons');
const { menuShape, docMetadataShape } = require('../../ui/default-prop-types');
const { DragDropContext, Droppable, Draggable } = require('react-beautiful-dnd');

const logger = new Logger(__filename);

const DOCS_DROPPABLE_ID = 'docRefs';
const DEFAULT_DOCS_DROPPABLE_ID = 'defaultDocRefs';
const CURRENT_MENU_ITEM_DOC_DROPPABLE_ID = 'currentMenuItemDocRefs';

// A little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

// Copies an item from one list to another list.
const addUnique = (source, destination, droppableSource, droppableDestination, copyFunc) => {
  const newSource = Array.from(source);
  const newDestination = Array.from(destination);
  const copiedItem = copyFunc(newSource[droppableSource.index]);

  newDestination.splice(droppableDestination.index, 0, copiedItem);

  return {
    [droppableSource.droppableId]: newSource,
    [droppableDestination.droppableId]: newDestination
  };
};

// Copies an item from one list to another list as single item.
const replaceSingle = (source, destination, droppableSource, droppableDestination, copyFunc) => {
  const newSource = Array.from(source);
  const newDestination = [copyFunc(newSource[droppableSource.index])];

  return {
    [droppableSource.droppableId]: newSource,
    [droppableDestination.droppableId]: newDestination
  };
};

class EditMenu extends React.Component {
  constructor(props) {
    super(props);

    autoBind(this);

    const { menuApiClient, initialState } = this.props;
    const { menu, docs } = initialState;

    this.menuApiClient = menuApiClient;

    const previousState = {
      menuId: null,
      menuTitle: '',
      menuSlug: null,
      menuDefaultDocumentKey: null,
      menuNodes: [],
      selectedNodeKey: null,
      currentCategoryTitle: '',
      docRefs: docs.map(this.createInitialDocRef),
      currentMenuItemDocRefs: [],
      defaultDocRefs: [],
      isDirty: false
    };

    this.state = {
      ...previousState,
      ...this.mapMenuToState(menu, previousState)
    };
  }

  createInitialDocRef(doc) {
    return {
      key: doc.key,
      doc: doc
    };
  }

  createNewDocRef(doc) {
    return {
      key: uniqueId.create(),
      doc: doc
    };
  }

  createDerivedDocRef(docRef) {
    return {
      key: uniqueId.create(),
      doc: docRef.doc
    };
  }

  mapMenuToState(menu, prevState = null) {
    const newState = {
      menuId: menu._id,
      menuTitle: cloneDeep(menu.title),
      menuSlug: menu.slug,
      menuDefaultDocumentKey: menu.defaultDocumentKey,
      menuNodes: cloneDeep(menu.nodes)
    };

    if (!prevState) {
      return newState;
    }

    const nodesByKey = {};
    this.visitMenuNodes(newState.menuNodes, node => {
      nodesByKey[node.key] = node;
    });

    const docRefsByDocKey = prevState.docRefs.reduce((all, docRef) => {
      all[docRef.doc.key] = docRef;
      return all;
    }, {});

    // Check for valid default document
    if (newState.menuDefaultDocumentKey) {
      newState.defaultDocRefs = [docRefsByDocKey[newState.menuDefaultDocumentKey]]
        .filter(docRef => !!docRef)
        .map(this.createDerivedDocRef);
    } else {
      newState.defaultDocRefs = [];
    }

    // Check for valid selected node and valid document references
    if (prevState.selectedNodeKey) {
      const foundNode = nodesByKey[prevState.selectedNodeKey];
      if (foundNode) {
        newState.selectedNodeKey = prevState.selectedNodeKey;
        newState.currentDocRefs = foundNode.documentKeys
          .map(key => docRefsByDocKey[key])
          .filter(docRef => !!docRef)
          .map(this.createDerivedDocRef);
      } else {
        newState.selectedNodeKey = null;
        newState.currentDocRefs = [];
      }
    } else {
      newState.selectedNodeKey = null;
      newState.currentDocRefs = [];
    }

    return newState;
  }

  mapStateToMenu() {
    const { menuId, menuTitle, menuSlug, menuDefaultDocumentKey, menuNodes } = this.state;
    return {
      _id: menuId,
      title: menuTitle,
      slug: menuSlug,
      defaultDocumentKey: menuDefaultDocumentKey,
      nodes: menuNodes
    };
  }

  async handleSaveClick() {
    const payload = this.mapStateToMenu();

    try {
      const { menu } = await this.menuApiClient.saveMenu(payload);
      this.setState(prevState => ({
        ...this.mapMenuToState(menu, prevState),
        isDirty: false
      }));
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleMenuNodesChanged(nodes) {
    this.setState({
      menuNodes: nodes,
      isDirty: true
    });
  }

  handleSelectedMenuNodeChanged(selectedNodeKey) {
    this.setState(prevState => {
      const newState = {
        ...prevState
      };

      newState.selectedNodeKey = selectedNodeKey;

      const selectedNode = this.getSelectedNode(newState.menuNodes, newState.selectedNodeKey);
      newState.currentCategoryTitle = selectedNode ? selectedNode.title : '';
      newState.currentMenuItemDocRefs = selectedNode ? this.createCurrentDocRefs(selectedNode, newState.docRefs) : [];

      return newState;
    });
  }

  getSelectedNode(menuNodes, selectedNodeKey) {
    let selectedNode = null;

    this.visitMenuNodes(menuNodes, (node, context) => {
      if (node.key === selectedNodeKey) {
        selectedNode = node;
        context.break();
      }
    });

    return selectedNode;
  }

  createCurrentDocRefs(currentNode, currentDocRefs) {
    return currentNode.documentKeys
      .map(key => currentDocRefs.find(x => x.key === key))
      .filter(x => x)
      .map(this.createDerivedDocRef);
  }

  id2List(id) {
    return {
      [DOCS_DROPPABLE_ID]: 'docRefs',
      [DEFAULT_DOCS_DROPPABLE_ID]: 'defaultDocRefs',
      [CURRENT_MENU_ITEM_DOC_DROPPABLE_ID]: 'currentMenuItemDocRefs'
    }[id];
  }

  getList(id) {
    // A semi-generic way to handle multiple lists. Maps
    // the IDs of the droppable container to the names of the
    // source arrays stored in the state.
    return this.state[this.id2List(id)];
  }

  handleDragEnd(result) {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    this.setState(prevState => {
      const newStateValues = {
        ...prevState
      };

      if (source.droppableId === CURRENT_MENU_ITEM_DOC_DROPPABLE_ID && destination.droppableId === CURRENT_MENU_ITEM_DOC_DROPPABLE_ID) {
        const reorderedItems = reorder(
          this.getList(source.droppableId),
          source.index,
          destination.index
        );

        newStateValues[this.id2List(source.droppableId)] = reorderedItems;
        newStateValues.menuNodes = this.updateMenuNodes(newStateValues);
      } else if (source.droppableId === DOCS_DROPPABLE_ID && destination.droppableId === CURRENT_MENU_ITEM_DOC_DROPPABLE_ID) {
        const copyResult = addUnique(
          this.getList(source.droppableId),
          this.getList(destination.droppableId),
          source,
          destination,
          this.createDerivedDocRef
        );

        Object.keys(copyResult).forEach(key => {
          newStateValues[this.id2List(key)] = copyResult[key];
        });
        newStateValues.menuNodes = this.updateMenuNodes(newStateValues);
      } else if (source.droppableId === DOCS_DROPPABLE_ID && destination.droppableId === DEFAULT_DOCS_DROPPABLE_ID) {
        const replaceResult = replaceSingle(
          this.getList(source.droppableId),
          this.getList(destination.droppableId),
          source,
          destination,
          this.createDerivedDocRef
        );

        Object.keys(replaceResult).forEach(key => {
          newStateValues[this.id2List(key)] = replaceResult[key];
        });
        newStateValues.menuDefaultDocumentKey = newStateValues.defaultDocRefs.length
          ? newStateValues.defaultDocRefs[0].doc.key
          : null;
      }

      return {
        ...newStateValues,
        isDirty: true
      };
    });
  }

  visitMenuNodes(nodes, cb) {
    nodes.forEach(rootNode => treeCrawl(rootNode, cb, { getChildren: node => node.children }));
  }

  updateMenuNodes({ menuNodes, selectedNodeKey, currentMenuItemDocRefs }) {
    const newMenuNodes = cloneDeep(menuNodes);
    this.visitMenuNodes(newMenuNodes, (node, context) => {
      if (node.key === selectedNodeKey) {
        node.documentKeys = currentMenuItemDocRefs.map(ref => ref.doc.key);
        context.break();
      }
    });
    return newMenuNodes;
  }

  handleBackClick() {
    window.location = urls.getMenusUrl();
  }

  handleDeleteDefaultDocRef(docRefKey) {
    this.setState(({ defaultDocRefs }) => ({
      defaultDocRefs: defaultDocRefs.filter(x => x.key !== docRefKey),
      menuDefaultDocumentKey: null,
      isDirty: true
    }));
  }

  handleDeleteMenuItemDocRef(docRefKey) {
    this.setState(({ currentMenuItemDocRefs, menuNodes, selectedNodeKey }) => {
      const newDocRefs = currentMenuItemDocRefs.filter(x => x.key !== docRefKey);
      const newMenuNodes = cloneDeep(menuNodes);
      this.visitMenuNodes(newMenuNodes, (node, context) => {
        if (node.key === selectedNodeKey) {
          node.documentKeys = newDocRefs.map(ref => ref.doc.key);
          context.break();
        }
      });

      return {
        currentMenuItemDocRefs: newDocRefs,
        menuNodes: newMenuNodes,
        isDirty: true
      };
    });
  }

  handleCategoryTitleChange(event) {
    const newCategoryTitle = event.target.value;
    this.setState(({ menuNodes, selectedNodeKey }) => {
      const newMenuNodes = cloneDeep(menuNodes);
      const selectedNode = this.getSelectedNode(newMenuNodes, selectedNodeKey);
      selectedNode.title = newCategoryTitle;

      return {
        currentCategoryTitle: newCategoryTitle,
        menuNodes: newMenuNodes,
        isDirty: true
      };
    });
  }

  handleMenuTitleChange(event) {
    const newValue = event.target.value;
    this.setState({
      menuTitle: newValue,
      isDirty: true
    });
  }

  handleMenuSlugChange(event) {
    const newValue = event.target.value;
    this.setState({
      menuSlug: newValue,
      isDirty: true
    });
  }

  render() {
    const {
      menuNodes,
      menuTitle,
      currentCategoryTitle,
      menuSlug,
      selectedNodeKey,
      defaultDocRefs,
      currentMenuItemDocRefs,
      docRefs,
      isDirty
    } = this.state;

    const headerActions = [];
    if (isDirty) {
      headerActions.push({
        key: 'save',
        type: 'primary',
        icon: SaveOutlined,
        text: 'Speichern',
        handleClick: this.handleSaveClick
      });
    }

    headerActions.push({
      key: 'close',
      icon: CloseOutlined,
      text: 'Zurück',
      handleClick: this.handleBackClick
    });

    return (
      <CheckPermissions permissions={EDIT_MENU_STRUCTURE}>
        {canEditMenuStructure => (
          <Page headerActions={headerActions}>
            <div className="EditMenuPage">
              <DragDropContext onDragEnd={this.handleDragEnd}>
                <div className="EditMenuPage-editor">
                  <div className="EditMenuPage-editorColumn EditMenuPage-editorColumn--left">
                    <div className="EditMenuPage-editorBox">
                      <div className="Panel">
                        <div className="Panel-header">
                          Metadaten
                        </div>
                        <div className="Panel-content">
                          <div>Titel</div>
                          <div>
                            <Input
                              value={menuTitle}
                              onChange={this.handleMenuTitleChange}
                              disabled={!canEditMenuStructure}
                              />
                          </div>
                          <br />
                          <div>URL-Pfad</div>
                          <div>
                            <Input
                              addonBefore={urls.menusPrefix}
                              value={menuSlug}
                              onChange={this.handleMenuSlugChange}
                              disabled={!canEditMenuStructure}
                              />
                          </div>
                          <br />
                          <div>Standard-Dokument</div>
                          <div>
                            <Droppable droppableId={DEFAULT_DOCS_DROPPABLE_ID} isDropDisabled={!canEditMenuStructure}>
                              {(droppableProvided, droppableState) => (
                                <div
                                  ref={droppableProvided.innerRef}
                                  className={classnames({ 'EditMenuPage-menuRefList': true, 'EditMenuPage-menuRefList--oneLine': true, 'is-draggingOver': droppableState.isDraggingOver })}
                                  >
                                  {defaultDocRefs.map(item => (
                                    <div
                                      key={item.key}
                                      className="EditMenuPage-menuRefListItem"
                                      >
                                      <MenuDocRef
                                        docRefKey={item.key}
                                        doc={item.doc}
                                        onDelete={canEditMenuStructure ? this.handleDeleteDefaultDocRef : null}
                                        />
                                    </div>
                                  ))}
                                  {droppableProvided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="EditMenuPage-editorBox">
                      <div className="Panel">
                        <div className="Panel-header">
                          Kategorien
                        </div>
                        <div className="Panel-content">
                          <MenuTree
                            nodes={menuNodes}
                            isReadonly={!canEditMenuStructure}
                            onNodesChanged={this.handleMenuNodesChanged}
                            onSelectedNodeChanged={this.handleSelectedMenuNodeChanged}
                            />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="EditMenuPage-editorColumn EditMenuPage-editorColumn--right">
                    <div className="EditMenuPage-editorBox">
                      <div className="Panel">
                        <div className="Panel-header">
                          Eigenschaften der Kategorie
                        </div>
                        <div className="Panel-content">
                          <div>Titel</div>
                          <div>
                            <Input
                              value={currentCategoryTitle}
                              onChange={this.handleCategoryTitleChange}
                              disabled={!canEditMenuStructure || !selectedNodeKey}
                              />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="EditMenuPage-editorBox">
                      <div className="Panel">
                        <div className="Panel-header">
                          Verlinkte Dokumente in Kategorie
                        </div>
                        <div className="Panel-content">
                          <Droppable droppableId={CURRENT_MENU_ITEM_DOC_DROPPABLE_ID} isDropDisabled={!selectedNodeKey}>
                            {(droppableProvided, droppableState) => (
                              <div
                                ref={droppableProvided.innerRef}
                                className={classnames({ 'EditMenuPage-menuRefList': true, 'is-draggingOver': droppableState.isDraggingOver })}
                                >
                                {currentMenuItemDocRefs.map((item, index) => (
                                  <Draggable
                                    key={item.key}
                                    draggableId={item.key}
                                    index={index}
                                    >
                                    {(draggableProvided, draggableState) => (
                                      <div
                                        ref={draggableProvided.innerRef}
                                        {...draggableProvided.draggableProps}
                                        {...draggableProvided.dragHandleProps}
                                        className={classnames({ 'EditMenuPage-menuRefListItem': true, 'is-dragging': draggableState.isDragging })}
                                        >
                                        <MenuDocRef
                                          docRefKey={item.key}
                                          doc={item.doc}
                                          onDelete={this.handleDeleteMenuItemDocRef}
                                          />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {droppableProvided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      </div>
                    </div>
                    <div className="EditMenuPage-editorBox">
                      <div className="Panel">
                        <div className="Panel-header">
                          Verfügbare Dokumente
                        </div>
                        <div className="Panel-content">
                          <Droppable droppableId={DOCS_DROPPABLE_ID} isDropDisabled>
                            {(droppableProvided, droppableState) => (
                              <div
                                ref={droppableProvided.innerRef}
                                className={classnames({ 'EditMenuPage-menuRefList': true, 'is-draggingOver': droppableState.isDraggingOver })}
                                >
                                {docRefs.map((item, index) => (
                                  <Draggable
                                    key={item.key}
                                    draggableId={item.key}
                                    index={index}
                                    >
                                    {(draggableProvided, draggableState) => (
                                      <div
                                        ref={draggableProvided.innerRef}
                                        {...draggableProvided.draggableProps}
                                        {...draggableProvided.dragHandleProps}
                                        className={classnames({ 'EditMenuPage-menuRefListItem': true, 'is-dragging': draggableState.isDragging })}
                                        >
                                        <MenuDocRef
                                          docRefKey={item.key}
                                          doc={item.doc}
                                          />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {droppableProvided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DragDropContext>
            </div>
          </Page>
        )}
      </CheckPermissions>
    );
  }
}

EditMenu.propTypes = {
  initialState: PropTypes.shape({
    menu: menuShape.isRequired,
    docs: PropTypes.arrayOf(docMetadataShape).isRequired
  }).isRequired,
  menuApiClient: PropTypes.instanceOf(MenuApiClient).isRequired
};

module.exports = inject({
  menuApiClient: MenuApiClient
}, EditMenu);
