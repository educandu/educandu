import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { LinkOutlined } from '@ant-design/icons';
import React, { Fragment, useState } from 'react';
import ResourceSelectorDialog from './resource-selector/resource-selector-dialog.js';

function MarkdownResourceSelector({ size, disabled, onUrlSelect }) {
  const { t } = useTranslation('markdownResourceSelector');
  const [isResourceSelectorDialogOpen, setIsResourceSelectorDialogOpen] = useState(false);

  const handleOpenResourceSelectorClick = () => {
    if (!disabled) {
      setIsResourceSelectorDialogOpen(true);
    }
  };

  const handleResourceSelectorDialogSelect = url => {
    setIsResourceSelectorDialogOpen(false);
    onUrlSelect(url);
  };

  const handleResourceSelectorDialogClose = () => {
    setIsResourceSelectorDialogOpen(false);
  };

  const resourceSelector = (
    <div
      onClick={handleOpenResourceSelectorClick}
      className={classNames({
        'MarkdownResourceSelector': true,
        'MarkdownResourceSelector--small': size === 'small',
        'is-disabled': disabled
      })}
      >
      <LinkOutlined />
    </div>
  );

  if (disabled) {
    return resourceSelector;
  }

  return (
    <Fragment>
      <Tooltip title={t('tooltip')}>{resourceSelector}</Tooltip>
      <ResourceSelectorDialog
        isOpen={isResourceSelectorDialogOpen}
        onSelect={handleResourceSelectorDialogSelect}
        onClose={handleResourceSelectorDialogClose}
        />
    </Fragment>
  );
}

MarkdownResourceSelector.propTypes = {
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['normal', 'small']),
  onUrlSelect: PropTypes.func
};

MarkdownResourceSelector.defaultProps = {
  disabled: false,
  size: 'normal',
  onUrlSelect: () => {}
};

export default MarkdownResourceSelector;
