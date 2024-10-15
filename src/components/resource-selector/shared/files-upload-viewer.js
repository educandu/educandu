import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { FILE_UPLOAD_STATUS } from './constants.js';
import EditIcon from '../../icons/general/edit-icon.js';
import FileIcon from '../../icons/general/file-icon.js';
import { CheckOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import ResourcePreviewWithMetadata from '../shared/resource-preview-with-metadata.js';

function FilesUploadViewer({
  items,
  canEdit,
  compact,
  previewedItemIndex,
  onEditItemClick,
  onItemClick,
}) {
  const { t } = useTranslation('filesUploadViewer');

  const handleItemEditClick = itemIndex => {
    onEditItemClick(itemIndex);
  };

  const handleItemClick = itemIndex => {
    onItemClick(itemIndex);
  };

  const renderItemName = (item, itemIndex) => {
    return (
      <div
        className={classNames(
          'FilesUploadViewer-itemName',
          { 'is-selected': items.length > 1 && previewedItemIndex === itemIndex }
        )}
        onClick={() => handleItemClick(itemIndex)}
        >
        {item.file.name}
      </div>
    );
  };

  const renderItem = (item, itemIndex) => {
    return (
      <div className="FilesUploadViewer-item">
        <div
          className={classNames(
            'FilesUploadViewer-itemRow',
            { 'is-selected': items.length > 1 && previewedItemIndex === itemIndex }
          )}
          >
          {item.status === FILE_UPLOAD_STATUS.pristine && !!item.isEditable && (
            <Tooltip title={t('common:edit')}>
              <a onClick={() => handleItemEditClick(itemIndex)} disabled={!canEdit}>
                <EditIcon className="FilesUploadViewer-itemIcon FilesUploadViewer-itemIcon--pristine" />
              </a>
            </Tooltip>
          )}
          {item.status === FILE_UPLOAD_STATUS.pristine && !item.isEditable && (
            <FileIcon className="FilesUploadViewer-itemIcon" />
          )}
          {item.status === FILE_UPLOAD_STATUS.processed && !!item.isEditable && (
            <Tooltip title={t('common:edit')}>
              <a onClick={() => handleItemEditClick(itemIndex)}>
                <EditIcon className="FilesUploadViewer-itemIcon FilesUploadViewer-itemIcon--processed" />
              </a>
            </Tooltip>
          )}
          {item.status === FILE_UPLOAD_STATUS.processed && !item.isEditable && (
            <FileIcon className="FilesUploadViewer-itemIcon FilesUploadViewer-itemIcon--processed" />
          )}
          {item.status === FILE_UPLOAD_STATUS.uploading && (
            <LoadingOutlined className="FilesUploadViewer-itemIcon" />
          )}
          {item.status === FILE_UPLOAD_STATUS.succeeded && (
            <CheckOutlined className="FilesUploadViewer-itemIcon FilesUploadViewer-itemIcon--success" />
          )}
          {item.status === FILE_UPLOAD_STATUS.failed && (
            <CloseOutlined className="FilesUploadViewer-itemIcon FilesUploadViewer-itemIcon--error" />
          )}
          {renderItemName(item, itemIndex)}
          {item.status === FILE_UPLOAD_STATUS.processed && (
            <span className="FilesUploadViewer-itemMessage">({t('processed')})</span>
          )}
        </div>
        {!!item.errorMessage && previewedItemIndex === itemIndex && (
          <div className="FilesUploadViewer-itemError">{item.errorMessage}</div>
        )}
      </div>
    );
  };

  return (
    <div
      className={classNames(
        'FilesUploadViewer',
        { 'FilesUploadViewer--compact': compact }
      )}
      >
      <div
        className={classNames(
          'FilesUploadViewer-itemsContainer',
          { 'FilesUploadViewer-itemsContainer--compact': compact },
          { 'FilesUploadViewer-itemsContainer--singleItem': compact && items.length === 1 }
        )}
        >
        {items.map((item, index) => (
          <div key={index.toString()}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      <div className="FilesUploadViewer-previewContainer">
        {!!items[previewedItemIndex] && (
          <ResourcePreviewWithMetadata
            urlOrFile={items[previewedItemIndex].file}
            size={items[previewedItemIndex].file.size}
            />
        )}
      </div>
    </div>
  );
}

FilesUploadViewer.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  compact: PropTypes.bool,
  previewedItemIndex: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    file: PropTypes.object.isRequired,
    status: PropTypes.oneOf(Object.values(FILE_UPLOAD_STATUS)),
    isEditable: PropTypes.bool,
    errorMessage: PropTypes.string
  })).isRequired,
  onEditItemClick: PropTypes.func,
  onItemClick: PropTypes.func.isRequired,
};

FilesUploadViewer.defaultProps = {
  compact: false,
  onEditItemClick: () => {}
};

export default FilesUploadViewer;
