const PropTypes = require('prop-types');
const React = require('react');

const preferredLanguages = ['de', 'en'];

function SectionDisplay({ DisplayComponent, rendererInstance, section }) {
  return (
    <section key={section.key} className="Section">
      <DisplayComponent
        section={section}
        renderer={rendererInstance}
        preferredLanguages={preferredLanguages}
        />
    </section>
  );
}

SectionDisplay.propTypes = {
  DisplayComponent: PropTypes.func.isRequired,
  rendererInstance: PropTypes.shape({
    getDisplayComponent: PropTypes.func.isRequired
  }).isRequired,
  section: PropTypes.shape({
    key: PropTypes.string.isRequired,
    order: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired
  }).isRequired
};

module.exports = SectionDisplay;
