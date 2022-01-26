import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useEffect, useState } from 'react';
import { CloseOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';

export function EditControlPanel({ children, onEdit, onSave, onClose }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandedContentVisible, setIsExpandedContentVisible] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => setIsExpandedContentVisible(true), 500);
    } else {
      setIsExpandedContentVisible(false);
    }
  }, [isExpanded]);

  const handleEditClick = async () => {
    try {
      setIsLoading(true);
      await onEdit();
      setIsExpanded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClick = () => {
    onSave();
  };

  const handleCloseClick = () => {
    setIsExpanded(false);
    onClose();
  };

  const renderExpandedContent = () => {
    return (
      <Fragment>
        <div className="EditControlPanel-children">
          {children}
        </div>
        <div className="EditControlPanel-buttonGroup">
          <Button className="EditControlPanel-button" size="small" icon={<SaveOutlined />} onClick={handleSaveClick} ghost>{t('common:save')}</Button>
          <Button className="EditControlPanel-button" size="small" icon={<CloseOutlined />} onClick={handleCloseClick} ghost>{t('common:close')}</Button>
        </div>
      </Fragment>

    );
  };

  const renderCollapsedContent = () => {
    return (
      <Button className="EditControlPanel-penButton" type="link" icon={<EditOutlined />} onClick={handleEditClick} loading={isLoading} />
    );
  };

  return (
    <div className={classNames('EditControlPanel', { 'is-expanded': isExpanded })}>
      {isExpanded && isExpandedContentVisible && renderExpandedContent()}
      {!isExpanded && renderCollapsedContent()}
    </div>
  );
}

EditControlPanel.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
  onSave: PropTypes.func
};

EditControlPanel.defaultProps = {
  children: null,
  onClose: () => {},
  onEdit: () => {},
  onSave: () => {}
};
