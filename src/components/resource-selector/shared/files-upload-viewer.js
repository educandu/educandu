import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { FILE_UPLOAD_STATUS } from './constants.js';
import FileIcon from '../../icons/general/file-icon.js';
import EditIcon from '../../icons/general/edit-icon.js';
import { mediaLibraryItemShape } from '../../../ui/default-prop-types.js';
import { CheckOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import ResourcePreviewWithMetadata from '../shared/resource-preview-with-metadata.js';
import MediaLibraryMetadataDisplay from '../media-library/media-library-metadata-display.js';
import ActionButton, { ACTION_BUTTON_INTENT, ActionButtonGroup } from '../../action-button.js';

function FilesUploadViewer({
  items,
  compact,
  canEdit,
  showInvalidItems,
  previewedItemIndex,
  onEditItemClick,
  onItemClick,
}) {
  const { t } = useTranslation('filesUploadViewer');
  const editableFileStatuses = [FILE_UPLOAD_STATUS.pristine, FILE_UPLOAD_STATUS.processed];
  const preUploadStatuses = [FILE_UPLOAD_STATUS.pristine, FILE_UPLOAD_STATUS.processed, FILE_UPLOAD_STATUS.failedValidation, FILE_UPLOAD_STATUS.uploading];

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

  const canRenderItem = item => {
    return !!item && (!!showInvalidItems || item.status !== FILE_UPLOAD_STATUS.failedValidation);
  };

  const renderItem = (item, itemIndex) => {
    if (!canRenderItem(item)) {
      return null;
    }

    const canRenderEditButton = item.isEditable && preUploadStatuses.includes(item.status);
    const canUseEditButton = canEdit && editableFileStatuses.includes(item.status);

    return (
      <div className="FilesUploadViewer-item">
        <div
          className={classNames(
            'FilesUploadViewer-itemRow',
            { 'is-selected': items.length > 1 && previewedItemIndex === itemIndex }
          )}
          >
          {(item.status === FILE_UPLOAD_STATUS.pristine || item.status === FILE_UPLOAD_STATUS.processed) && (
            <FileIcon className="FilesUploadViewer-itemIcon" />
          )}
          {item.status === FILE_UPLOAD_STATUS.uploading && (
            <LoadingOutlined className="FilesUploadViewer-itemIcon" />
          )}
          {item.status === FILE_UPLOAD_STATUS.succeededUpload && (
            <CheckOutlined className="FilesUploadViewer-itemIcon FilesUploadViewer-itemIcon--success" />
          )}
          {(item.status === FILE_UPLOAD_STATUS.failedValidation || item.status === FILE_UPLOAD_STATUS.failedUpload) && (
            <CloseOutlined className="FilesUploadViewer-itemIcon FilesUploadViewer-itemIcon--error" />
          )}
          {renderItemName(item, itemIndex)}
          {!!canRenderEditButton && (
            <ActionButtonGroup>
              <ActionButton
                title={t('editImage')}
                icon={<EditIcon />}
                disabled={!canUseEditButton}
                intent={item.status === FILE_UPLOAD_STATUS.processed ? ACTION_BUTTON_INTENT.warning : ACTION_BUTTON_INTENT.success}
                onClick={() => handleItemEditClick(itemIndex)}
                />
            </ActionButtonGroup>
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
        {!!canRenderItem(items[previewedItemIndex]) && (
          <Fragment>
            <ResourcePreviewWithMetadata
              urlOrFile={items[previewedItemIndex].file}
              size={items[previewedItemIndex].file.size}
              />
            {!!items[previewedItemIndex].createdMediaLibraryItem && (
              <div className='FilesUploadViewer-previewContainerMetadata'>
                <MediaLibraryMetadataDisplay mediaLibraryItem={items[previewedItemIndex].createdMediaLibraryItem} />
              </div>
            )}
          </Fragment>
        )}
      </div>
    </div>
  );
}

FilesUploadViewer.propTypes = {
  compact: PropTypes.bool,
  previewedItemIndex: PropTypes.number.isRequired,
  canEdit: PropTypes.bool.isRequired,
  showInvalidItems: PropTypes.bool.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    file: PropTypes.object.isRequired,
    status: PropTypes.oneOf(Object.values(FILE_UPLOAD_STATUS)).isRequired,
    isEditable: PropTypes.bool,
    errorMessage: PropTypes.string,
    createdMediaLibraryItem: mediaLibraryItemShape
  })).isRequired,
  onEditItemClick: PropTypes.func,
  onItemClick: PropTypes.func.isRequired,
};

FilesUploadViewer.defaultProps = {
  compact: false,
  onEditItemClick: () => {}
};

export default FilesUploadViewer;
