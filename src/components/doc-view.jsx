const React = require('react');
const PropTypes = require('prop-types');
const { inject } = require('./container-context.jsx');
const SectionDisplay = require('./section-display.jsx');
const RendererFactory = require('../plugins/renderer-factory');
const { docShape, sectionShape } = require('../ui/default-prop-types');

function DocView({ doc, sections, rendererFactory, language, onAction }) {
  const children = sections.map(section => {
    const renderer = rendererFactory.createRenderer(section.type);
    const DisplayComponent = renderer.getDisplayComponent();
    return (
      <SectionDisplay
        key={section.key}
        doc={doc}
        section={section}
        language={language}
        DisplayComponent={DisplayComponent}
        onAction={onAction}
        />
    );
  });

  return (
    <article className="DocView">
      {children}
    </article>
  );
}

DocView.propTypes = {
  doc: docShape.isRequired,
  language: PropTypes.string.isRequired,
  onAction: PropTypes.func,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired,
  sections: PropTypes.arrayOf(sectionShape).isRequired
};

DocView.defaultProps = {
  onAction: null
};

module.exports = inject({
  rendererFactory: RendererFactory
}, DocView);
