const React = require('react');
const autoBind = require('auto-bind');
const urls = require('../utils/urls');
const PropTypes = require('prop-types');
const Button = require('antd/lib/button');
const { docMetadataShape } = require('../ui/default-prop-types');


class MenuDocRef extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleDeleteButtonClick() {
    const { docRefKey, onDelete } = this.props;
    onDelete(docRefKey);
  }

  render() {
    const { doc, onDelete } = this.props;
    return (
      <div className="MenuDocRef">
        <div className="MenuDocRef-title">{doc.title}</div>
        <div className="MenuDocRef-url">{urls.getArticleUrl(doc.slug) || '(Kein URL-Pfad zugewiesen)'}</div>
        {onDelete && (
          <div className="MenuDocRef-deleteButton">
            <Button onClick={this.handleDeleteButtonClick}>(X)</Button>
          </div>
        )}
      </div>
    );
  }
}

MenuDocRef.propTypes = {
  doc: docMetadataShape.isRequired,
  docRefKey: PropTypes.string.isRequired,
  onDelete: PropTypes.func
};

MenuDocRef.defaultProps = {
  onDelete: null
};

module.exports = MenuDocRef;
