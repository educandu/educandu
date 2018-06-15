const RendererFactory = require('../../plugins/renderer-factory');
const PageHeader = require('./../page-header.jsx');
const { Container } = require('../../common/di');
const PropTypes = require('prop-types');
const React = require('react');

/* eslint no-warning-comments: 0 */
/* eslint react/prop-types: 0 */
/* eslint react/no-multi-comp: 0 */
/* eslint react/forbid-prop-types: 0 */

const preferredLanguages = ['de', 'en'];

function SectionDisplay({ DisplayComponent, rendererInstance, section }) {
  return (
    <section
      key={section.key}
      className="Section Section-display"
      data-section-key={section.key}
      data-section-order={section.order}
      data-section-type={section.type}
      >
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
  rendererInstance: PropTypes.object.isRequired,
  section: PropTypes.shape({
    key: PropTypes.string.isRequired,
    order: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired
  }).isRequired
};

class Doc extends React.Component {
  constructor(props) {
    super(props);

    const { container, initialState } = this.props;

    this.rendererFactory = container.get(RendererFactory);

    const doc = initialState;
    this.state = this.createStateFromDoc(doc);
  }

  createStateFromDoc(doc) {
    return {
      originalDoc: doc,
      sectionInfos: doc.sections.map(section => {
        const rendererInstance = this.rendererFactory.createRenderer(section.type, section);
        const DisplayComponent = rendererInstance.getDisplayComponent();
        return { section, rendererInstance, DisplayComponent };
      })
    };
  }

  render() {
    const { originalDoc, sectionInfos } = this.state;
    const children = sectionInfos.map(({ section, rendererInstance, DisplayComponent }) => (
      <SectionDisplay
        key={section.key}
        DisplayComponent={DisplayComponent}
        rendererInstance={rendererInstance}
        section={section}
        />
    ));
    return (
      <React.Fragment>
        <PageHeader>
          <a href={`/edit/doc/${originalDoc._id}`}>Bearbeiten</a>
        </PageHeader>
        <div>
          {children}
        </div>
      </React.Fragment>
    );
  }
}

Doc.propTypes = {
  container: PropTypes.instanceOf(Container).isRequired,
  initialState: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      content: PropTypes.object,
      order: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired
    }))
  }).isRequired
};

module.exports = Doc;
