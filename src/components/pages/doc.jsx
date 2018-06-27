const RendererFactory = require('../../plugins/renderer-factory');
const SectionDisplay = require('../section-display.jsx');
const { inject } = require('../container-context.jsx');
const PageHeader = require('./../page-header.jsx');
const PropTypes = require('prop-types');
const React = require('react');

function Doc({ initialState, rendererFactory }) {
  const { doc, sections, language } = initialState;

  const children = sections.map(section => {
    const renderer = rendererFactory.createRenderer(section.type);
    const DisplayComponent = renderer.getDisplayComponent();
    return (
      <SectionDisplay
        key={section.key}
        section={section}
        language={language}
        DisplayComponent={DisplayComponent}
        />
    );
  });

  return (
    <React.Fragment>
      <PageHeader>
        <a href={`/edit/doc/${doc.key}`}>Bearbeiten</a>
      </PageHeader>
      <div className="PageContent">
        {children}
      </div>
    </React.Fragment>
  );
}

Doc.propTypes = {
  initialState: PropTypes.shape({
    doc: PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    }),
    sections: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      order: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      content: PropTypes.any.isRequired
    })),
    language: PropTypes.string.isRequired
  }).isRequired,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired
};

module.exports = inject({
  rendererFactory: RendererFactory
}, Doc);
