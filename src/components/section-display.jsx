const { docShape, sectionShape } = require('../ui/default-prop-types');
const PropTypes = require('prop-types');
const React = require('react');

function SectionDisplay({ DisplayComponent, language, doc, section }) {
  return (
    <section key={section.key} className="Section">
      <DisplayComponent
        docKey={doc.key}
        sectionKey={section.key}
        content={section.content[language]}
        language={language}
        />
    </section>
  );
}

SectionDisplay.propTypes = {
  DisplayComponent: PropTypes.func.isRequired,
  doc: docShape.isRequired,
  language: PropTypes.string.isRequired,
  section: sectionShape.isRequired
};

module.exports = SectionDisplay;
