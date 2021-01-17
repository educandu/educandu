import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloseCircleFilled } from '@ant-design/icons';
import { sectionShape } from '../ui/default-prop-types';

function DeletedSection({ section }) {
  const { t } = useTranslation('deletedSection');

  return (
    <div className="DeletedSection">
      <div className="DeletedSection-icon"><CloseCircleFilled /></div>
      <div className="DeletedSection-title">{t('messageTitle')}</div>
      <div className="DeletedSection-subtitle">{section.deletedBecause}</div>
    </div>
  );
}

DeletedSection.propTypes = {
  section: sectionShape.isRequired
};

export default DeletedSection;
