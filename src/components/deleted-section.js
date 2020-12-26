import React from 'react';
import { CloseCircleFilled } from '@ant-design/icons';
import { sectionShape } from '../ui/default-prop-types';

function DeletedSection({ section }) {
  return (
    <div className="DeletedSection">
      <div className="DeletedSection-icon"><CloseCircleFilled /></div>
      <div className="DeletedSection-title">Dieser Inhalt wurde gelöscht</div>
      <div className="DeletedSection-subtitle">{section.deletedBecause}</div>
    </div>
  );
}

DeletedSection.propTypes = {
  section: sectionShape.isRequired
};

export default DeletedSection;
