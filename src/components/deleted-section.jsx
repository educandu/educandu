const React = require('react');
const Icon = require('antd/lib/icon');
const { sectionShape } = require('../ui/default-prop-types');

function DeletedSection({ section }) {
  return (
    <div className="DeletedSection">
      <div className="DeletedSection-icon"><Icon type="close-circle" theme="filled" /></div>
      <div className="DeletedSection-title">Dieser Inhalt wurde gelöscht</div>
      <div className="DeletedSection-subtitle">{section.deletedBecause}</div>
    </div>
  );
}

DeletedSection.propTypes = {
  section: sectionShape.isRequired
};

module.exports = DeletedSection;
