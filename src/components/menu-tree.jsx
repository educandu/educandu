const React = require('react');
const autoBind = require('auto-bind');
const Tree = require('antd/lib/tree');
const Icon = require('antd/lib/icon');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const PropTypes = require('prop-types');
const treeCrawl = require('tree-crawl');
const Button = require('antd/lib/button');
const uniqueId = require('../utils/unique-id');
const cloneDeep = require('../utils/clone-deep');
const { inject } = require('./container-context.jsx');
const MenuApiClient = require('../services/menu-api-client');
const { menuNodeShape } = require('../ui/default-prop-types');

const TreeNode = Tree.TreeNode;

const visitMenuNodes = (nodes, cb) => {
  nodes.forEach(rootNode => treeCrawl(rootNode, cb, { getChildren: node => node.children }));
};

class MenuTree extends React.PureComponent {
  constructor(props) {
    super(props);

    autoBind.react(this);

    this.state = {
      nodes: [],
      selectedKey: null,
      expandedKeys: [],
      autoExpandParent: true,
      isNewNodeModalVisible: false,
      newNodeTitle: ''
    };
  }

  static getDerivedStateFromProps({ nodes }, { selectedKey, expandedKeys }) {
    const proposedExpandedKeys = expandedKeys || [];
    const validExpandedKeys = [];
    let validSelectedKey = null;

    visitMenuNodes(nodes, node => {
      if (proposedExpandedKeys.includes(node.key)) {
        validExpandedKeys.push(node.key);
      }

      if (node.key === selectedKey) {
        validSelectedKey = node.key;
      }
    });

    return {
      nodes: cloneDeep(nodes),
      selectedKey: validSelectedKey || null,
      expandedKeys: validExpandedKeys,
      autoExpandParent: true
    };
  }

  handleSelect(selectedKeys) {
    const { onSelectedNodeChanged } = this.props;
    const newSelectedKey = selectedKeys[0] || null;

    this.setState({ selectedKey: newSelectedKey });
    onSelectedNodeChanged(newSelectedKey);
  }

  handleNewNodeClick() {
    this.setState({
      newNodeTitle: '',
      isNewNodeModalVisible: true
    });
  }

  handleNewNodeTitleChange(event) {
    this.setState({
      newNodeTitle: event.target.value
    });
  }

  handleNewNodeOk() {
    const { onNodesChanged, onSelectedNodeChanged } = this.props;
    const { nodes, selectedKey, expandedKeys, newNodeTitle } = this.state;
    const updatedNodes = cloneDeep(nodes);
    let nodeKeyToExpand;
    let nodeList;

    if (selectedKey) {
      const foundNode = this.findNodeByKey(updatedNodes, selectedKey);
      if (foundNode) {
        nodeKeyToExpand = foundNode.key;
        if (!foundNode.children) {
          foundNode.children = [];
        }

        nodeList = foundNode.children;
      }
    }

    if (!nodeList) {
      nodeList = updatedNodes;
    }

    const newNode = {
      key: uniqueId.create(),
      title: newNodeTitle,
      children: [],
      documentKeys: []
    };

    nodeList.push(newNode);

    const newExpandedKeys = expandedKeys.slice();
    if (nodeKeyToExpand && !newExpandedKeys.includes(nodeKeyToExpand)) {
      newExpandedKeys.push(nodeKeyToExpand);
    }

    this.setState({
      newNodeTitle: '',
      isNewNodeModalVisible: false,
      nodes: updatedNodes,
      selectedKey: newNode.key,
      expandedKeys: newExpandedKeys
    });

    onNodesChanged(updatedNodes);
    onSelectedNodeChanged(newNode.key);
  }

  handleNewNodeCancel() {
    this.setState({
      newNodeTitle: '',
      isNewNodeModalVisible: false
    });
  }

  handleDeleteNodeClick() {
    const { onNodesChanged, onSelectedNodeChanged } = this.props;
    const { nodes, selectedKey, expandedKeys } = this.state;
    let updatedNodes = cloneDeep(nodes);

    const foundNode = this.findParentNodeByKey(updatedNodes, selectedKey);
    if (foundNode) {
      foundNode.children = foundNode.children.filter(x => x.key !== selectedKey);
    } else {
      updatedNodes = updatedNodes.filter(x => x.key !== selectedKey);
    }

    const newExpandedKeys = [];
    visitMenuNodes(updatedNodes, node => {
      if (expandedKeys.includes(node.key)) {
        newExpandedKeys.push(node.key);
      }
    });

    this.setState({
      nodes: updatedNodes,
      selectedKey: null,
      expandedKeys: newExpandedKeys
    });

    onNodesChanged(updatedNodes);
    onSelectedNodeChanged(null);
  }

  findNodeByKey(nodes, key) {
    let foundNode;
    visitMenuNodes(nodes, (node, context) => {
      if (node.key === key) {
        foundNode = node;
        context.break();
      }
    });
    return foundNode || null;
  }

  findParentNodeByKey(nodes, key) {
    let foundNode;
    visitMenuNodes(nodes, (node, context) => {
      if (node.key === key) {
        foundNode = context.parent;
        context.break();
      }
    });
    return foundNode || null;
  }

  handleExpand(newExpandedKeys) {
    this.setState({
      expandedKeys: newExpandedKeys,
      autoExpandParent: false
    });
  }

  handleDrop(info) {
    const { onNodesChanged } = this.props;
    const { nodes } = this.state;

    const dropKey = info.node.props.eventKey;
    const dragKey = info.dragNode.props.eventKey;
    const dropPos = info.node.props.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const loop = (data, key, callback) => {
      data.forEach((item, index, arr) => {
        if (item.key === key) {
          callback(item, index, arr);
          return;
        }
        if (item.children) {
          loop(item.children, key, callback);
        }
      });
    };

    const newNodes = cloneDeep(nodes);
    let dragObj;

    loop(newNodes, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (info.dropToGap) {
      let ar;
      let i;
      loop(newNodes, dropKey, (item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    } else {
      loop(newNodes, dropKey, item => {
        item.children = item.children || [];
        item.children.push(dragObj);
      });
    }

    this.setState({
      nodes: newNodes
    });

    onNodesChanged(newNodes);
  }

  renderNodeList(nodes) {
    return nodes.map(node => (
      <TreeNode
        key={node.key}
        icon={<Icon type={node.documentKeys.length ? 'menu-unfold' : 'file'} />}
        title={<span>{node.title}</span>}
        >
        {node.children && this.renderNodeList(node.children)}
      </TreeNode>
    ));
  }

  render() {
    const { isReadonly } = this.props;
    const { expandedKeys, selectedKey, autoExpandParent, nodes, isNewNodeModalVisible, newNodeTitle } = this.state;
    return (
      <div>
        <Tree
          showIcon
          draggable={!isReadonly}
          onDrop={this.handleDrop}
          expandedKeys={expandedKeys}
          onExpand={this.handleExpand}
          onSelect={this.handleSelect}
          autoExpandParent={autoExpandParent}
          selectedKeys={[selectedKey].filter(x => x)}
          defaultExpandedKeys={this.state.expandedKeys}
          >
          {this.renderNodeList(nodes)}
        </Tree>
        <br />
        <br />
        <Button type="primary" icon="plus" onClick={this.handleNewNodeClick} disabled={isReadonly}>Neuer Menüeintrag</Button>
        &nbsp;
        {selectedKey && <Button type="danger" icon="delete" onClick={this.handleDeleteNodeClick} disabled={isReadonly}>Menüeintrag löschen</Button>}
        <Modal
          title="Neuer Menüeintrag"
          visible={isNewNodeModalVisible}
          onOk={this.handleNewNodeOk}
          onCancel={this.handleNewNodeCancel}
          >
          <p>Titel</p>
          <p><Input value={newNodeTitle} onChange={this.handleNewNodeTitleChange} /></p>
        </Modal>
      </div>
    );
  }
}

MenuTree.propTypes = {
  isReadonly: PropTypes.bool,
  /* eslint-disable-next-line react/no-unused-prop-types */ // It is used in getDerivedStateFromProps !!!
  nodes: PropTypes.arrayOf(menuNodeShape).isRequired,
  onNodesChanged: PropTypes.func.isRequired,
  onSelectedNodeChanged: PropTypes.func.isRequired
};

MenuTree.defaultProps = {
  isReadonly: false
};

module.exports = inject({
  menuApiClient: MenuApiClient
}, MenuTree);
