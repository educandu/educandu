import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import treeCrawl from 'tree-crawl';
import uniqueId from '../utils/unique-id';
import cloneDeep from '../utils/clone-deep';
import { inject } from './container-context';
import { withTranslation } from 'react-i18next';
import { Tree, Input, Modal, Button } from 'antd';
import MenuApiClient from '../services/menu-api-client';
import { menuNodeShape, translationProps } from '../ui/default-prop-types';
import Icon, { PlusOutlined, DeleteOutlined, MenuUnfoldOutlined, FileOutlined } from '@ant-design/icons';

const visitMenuNodes = (nodes, cb) => {
  nodes.forEach(rootNode => treeCrawl(rootNode, cb, { getChildren: node => node.children }));
};

class MenuTree extends React.PureComponent {
  constructor(props) {
    super(props);

    autoBind(this);

    this.state = {
      nodes: [],
      selectedKey: null,
      isNewNodeModalVisible: false,
      newNodeTitle: ''
    };
  }

  static getDerivedStateFromProps({ nodes }, { selectedKey }) {
    let validSelectedKey = null;

    visitMenuNodes(nodes, node => {
      if (node.key === selectedKey) {
        validSelectedKey = node.key;
      }
    });

    return {
      nodes: cloneDeep(nodes),
      selectedKey: validSelectedKey || null
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
    const { nodes, selectedKey, newNodeTitle } = this.state;
    const updatedNodes = cloneDeep(nodes);
    let nodeList;

    if (selectedKey) {
      const foundNode = this.findNodeByKey(updatedNodes, selectedKey);
      if (foundNode) {
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

    this.setState({
      newNodeTitle: '',
      isNewNodeModalVisible: false,
      nodes: updatedNodes,
      selectedKey: newNode.key
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
    const { nodes, selectedKey } = this.state;
    let updatedNodes = cloneDeep(nodes);

    const foundNode = this.findParentNodeByKey(updatedNodes, selectedKey);
    if (foundNode) {
      foundNode.children = foundNode.children.filter(x => x.key !== selectedKey);
    } else {
      updatedNodes = updatedNodes.filter(x => x.key !== selectedKey);
    }

    this.setState({
      nodes: updatedNodes,
      selectedKey: null
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

  handleDragStart(info) {
    const { onSelectedNodeChanged } = this.props;

    this.setState({
      selectedKey: info.node.key
    });

    onSelectedNodeChanged(info.node.key);
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

    const data = cloneDeep(nodes);
    let dragObj;

    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!info.dropToGap) {
      loop(data, dropKey, item => {
        item.children = item.children || [];
        item.children.unshift(dragObj);
      });
    } else if ((info.node.props.children || []).length !== 0 && info.node.props.expanded && dropPosition === 1) {
      loop(data, dropKey, item => {
        item.children = item.children || [];
        item.children.unshift(dragObj);
      });
    } else {
      let ar;
      let i;
      loop(data, dropKey, (item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    }

    this.setState({
      nodes: data
    });

    onNodesChanged(data);
  }

  getTreeData(nodes) {
    return nodes.map(node => ({
      key: node.key,
      title: node.title,
      icon: <Icon component={node.documentKeys.length ? MenuUnfoldOutlined : FileOutlined} />,
      children: this.getTreeData(node.children)
    }));
  }

  render() {
    const { isReadonly, t } = this.props;
    const { selectedKey, nodes, isNewNodeModalVisible, newNodeTitle } = this.state;
    return (
      <div>
        <Tree
          showIcon
          draggable={!isReadonly}
          onDrop={this.handleDrop}
          onSelect={this.handleSelect}
          onDragStart={this.handleDragStart}
          treeData={this.getTreeData(nodes)}
          selectedKeys={[selectedKey].filter(x => x)}
          />
        <br />
        <br />
        <Button type="primary" icon={<PlusOutlined />} onClick={this.handleNewNodeClick} disabled={isReadonly}>{t('newMenuEntry')}</Button>
        &nbsp;
        {selectedKey && <Button type="danger" icon={<DeleteOutlined />} onClick={this.handleDeleteNodeClick} disabled={isReadonly}>{t('deleteMenuEntry')}</Button>}
        <Modal
          title={t('newMenuEntry')}
          visible={isNewNodeModalVisible}
          onOk={this.handleNewNodeOk}
          onCancel={this.handleNewNodeCancel}
          >
          <p>{t('title')}</p>
          <p><Input value={newNodeTitle} onChange={this.handleNewNodeTitleChange} /></p>
        </Modal>
      </div>
    );
  }
}

MenuTree.propTypes = {
  ...translationProps,
  isReadonly: PropTypes.bool,
  nodes: PropTypes.arrayOf(menuNodeShape).isRequired,
  onNodesChanged: PropTypes.func.isRequired,
  onSelectedNodeChanged: PropTypes.func.isRequired
};

MenuTree.defaultProps = {
  isReadonly: false
};

export default withTranslation('menuTree')(inject({
  menuApiClient: MenuApiClient
}, MenuTree));
