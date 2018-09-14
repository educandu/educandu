const React = require('react');
const autoBind = require('auto-bind');
const Tree = require('antd/lib/tree');
const Icon = require('antd/lib/icon');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const PropTypes = require('prop-types');
const treeCrawl = require('tree-crawl');
const Button = require('antd/lib/button');
const { inject } = require('./container-context.jsx');
const stringUtils = require('./../utils/string-utils');
const MenuApiClient = require('./../services/menu-api-client');
const { menuNodeShape } = require('./../ui/default-prop-types');

const TreeNode = Tree.TreeNode;
const Search = Input.Search;

const cloneDeep = obj => JSON.parse(JSON.stringify(obj));

class MenuTree extends React.PureComponent {
  constructor(props) {
    super(props);

    autoBind.react(this);

    const { nodes } = this.props;

    this.state = {
      ...this.createStateValuesFromMenu({ nodes }),
      isNewNodeModalVisible: false,
      newNodeTitle: ''
    };
  }

  createStateValuesFromMenu({ nodes, selectedKey, expandedKeys, searchTerm }) {
    const proposedExpandedKeys = expandedKeys || [];
    const validExpandedKeys = [];
    let validSelectedKey = null;

    this.visitMenuNodes(nodes, (node, context) => {
      if (proposedExpandedKeys.includes(node.key)) {
        validExpandedKeys.push(node.key);
      } else if (searchTerm && context.parent && stringUtils.getSearchTermIndex(node.title, searchTerm) !== -1) {
        validExpandedKeys.push(node.key);
      }

      if (node.key === selectedKey) {
        validSelectedKey = node.key;
      }
    });

    return {
      nodes: cloneDeep(nodes),
      isDirty: false,
      selectedKey: validSelectedKey || null,
      expandedKeys: validExpandedKeys,
      searchTerm: searchTerm || '',
      autoExpandParent: true
    };
  }

  visitMenuNodes(nodes, cb) {
    nodes.forEach(rootNode => treeCrawl(rootNode, cb, { getChildren: node => node.children }));
  }

  getExpandedKeysForSearchTerm(searchTerm) {
    const expandedKeys = [];

    this.visitMenuNodes(this.state.nodes, (node, context) => {
      if (context.parent && stringUtils.getSearchTermIndex(node.title, searchTerm) !== -1) {
        expandedKeys.push(node.key);
      }
    });

    return expandedKeys;
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
    const { onNodesChanged } = this.props;
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
      key: newNodeTitle,
      title: newNodeTitle,
      children: []
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
  }

  handleNewNodeCancel() {
    this.setState({
      newNodeTitle: '',
      isNewNodeModalVisible: false
    });
  }

  findNodeByKey(nodes, key) {
    let foundNode;
    this.visitMenuNodes(nodes, (node, context) => {
      if (node.key === key) {
        foundNode = node;
        context.break();
      }
    });
    return foundNode;
  }

  handleExpand(newExpandedKeys) {
    this.setState({
      expandedKeys: newExpandedKeys,
      autoExpandParent: false
    });
  }

  handleSearchChange(event) {
    const newSearchTerm = event.target.value;
    const newExpandedKeys = this.getExpandedKeysForSearchTerm(newSearchTerm);

    this.setState({
      expandedKeys: newExpandedKeys,
      autoExpandParent: true,
      searchTerm: newSearchTerm
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

  renderNodeTitle(title, highlighText) {
    const index = stringUtils.getSearchTermIndex(title, highlighText);
    if (index === -1) {
      return <span>{title}</span>;
    }

    const parts = stringUtils.splitAt(title, index, index + highlighText.length);
    return (
      <span>{parts[0]}<span style={{ backgroundColor: 'yellow' }}>{parts[1]}</span>{parts[2]}</span>
    );
  }

  renderNodeList(nodes, highlighText) {
    return nodes.map(node => (
      <TreeNode
        key={node.key}
        icon={<Icon type={Math.random() < 0.5 ? 'bars' : 'file'} />}
        title={this.renderNodeTitle(node.title, highlighText)}
        >
        {node.children && this.renderNodeList(node.children, highlighText)}
      </TreeNode>
    ));
  }

  render() {
    const { searchTerm, expandedKeys, selectedKey, autoExpandParent, nodes, isNewNodeModalVisible, newNodeTitle } = this.state;
    return (
      <div>
        <Search placeholder="Search" onChange={this.handleSearchChange} />
        <br />
        <br />
        <Tree
          showIcon
          draggable
          onDrop={this.handleDrop}
          expandedKeys={expandedKeys}
          onExpand={this.handleExpand}
          onSelect={this.handleSelect}
          autoExpandParent={autoExpandParent}
          selectedKeys={[selectedKey].filter(x => x)}
          defaultExpandedKeys={this.state.expandedKeys}
          >
          {this.renderNodeList(nodes, searchTerm)}
        </Tree>
        <br />
        <br />
        <Button type="primary" icon="plus" onClick={this.handleNewNodeClick}>Neuer Menüeintrag</Button>
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
  nodes: PropTypes.arrayOf(menuNodeShape).isRequired,
  onNodesChanged: PropTypes.func.isRequired,
  onSelectedNodeChanged: PropTypes.func.isRequired
};

module.exports = inject({
  menuApiClient: MenuApiClient
}, MenuTree);
