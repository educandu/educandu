const PropTypes = require('prop-types');
const React = require('react');

function SectionDisplay({ DisplayComponent, language, section }) {
  return (
    <section key={section.key} className="Section">
      <DisplayComponent
        content={section.content}
        language={language}
        />
    </section>
  );
}

SectionDisplay.propTypes = {
  DisplayComponent: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
  section: PropTypes.shape({
    key: PropTypes.string.isRequired,
    order: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    content: PropTypes.any.isRequired
  }).isRequired
};

module.exports = SectionDisplay;
