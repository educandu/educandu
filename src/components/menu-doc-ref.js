import React from 'react';
import { Button } from 'antd';
import autoBind from 'auto-bind';
import urls from '../utils/urls';
import PropTypes from 'prop-types';
import { DeleteOutlined } from '@ant-design/icons';
import { documentMetadataShape } from '../ui/default-prop-types';

class MenuDocRef extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleDeleteButtonClick() {
    const { docRefKey, onDelete } = this.props;
    onDelete(docRefKey);
  }

  render() {
    const { doc, onDelete } = this.props;
    return (
      <div className="MenuDocRef">
        <div className="MenuDocRef-titleAndUrl">
          <div className="MenuDocRef-title">{doc.title}</div>
          <div className="MenuDocRef-url">{urls.getArticleUrl(doc.slug) || '(Kein URL-Pfad zugewiesen)'}</div>
        </div>
        {onDelete && (
          <div className="MenuDocRef-deleteButton">
            <Button type="danger" size="small" icon={<DeleteOutlined />} ghost onClick={this.handleDeleteButtonClick} />
          </div>
        )}
      </div>
    );
  }
}

MenuDocRef.propTypes = {
  doc: documentMetadataShape.isRequired,
  docRefKey: PropTypes.string.isRequired,
  onDelete: PropTypes.func
};

MenuDocRef.defaultProps = {
  onDelete: null
};

export default MenuDocRef;
