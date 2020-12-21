const React = require('react');
const { CloseCircleFilled } = require('@ant-design/icons');
const { sectionShape } = require('../ui/default-prop-types');

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

module.exports = DeletedSection;
