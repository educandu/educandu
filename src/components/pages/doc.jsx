const RendererFactory = require('../../plugins/renderer-factory');
const SectionDisplay = require('../section-display.jsx');
const { inject } = require('../container-context.jsx');
const PageHeader = require('./../page-header.jsx');
const PropTypes = require('prop-types');
const React = require('react');

class Doc extends React.Component {
  constructor(props) {
    super(props);

    const { initialState, rendererFactory } = this.props;

    this.rendererFactory = rendererFactory;
    this.state = this.createStateFromDoc(initialState);
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
  initialState: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      order: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired
    }))
  }).isRequired,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired
};

module.exports = inject({
  rendererFactory: RendererFactory
}, Doc);
