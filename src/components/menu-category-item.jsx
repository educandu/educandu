const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { menuNodeShape } = require('../ui/default-prop-types');

class MenuCategoryItem extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleNodeClick() {
    const { node, onNodeClick } = this.props;
    onNodeClick(node);
  }

  render() {
    const { node, isActive } = this.props;
    const content = node.documentKeys.length
      ? <a onClick={this.handleNodeClick}>{node.title}</a>
      : node.title;

    return isActive ? <b>{content}</b> : content;
  }
}

MenuCategoryItem.propTypes = {
  isActive: PropTypes.bool.isRequired,
  node: menuNodeShape.isRequired,
  onNodeClick: PropTypes.func.isRequired
};

module.exports = MenuCategoryItem;
