const React = require('react');
const PropTypes = require('prop-types');
const SectionDisplay = require('./section-display.jsx');
const { useService } = require('./container-context.jsx');
const RendererFactory = require('../plugins/renderer-factory');
const { docShape, sectionShape } = require('../ui/default-prop-types');

function DocView({ doc, sections, language, onAction }) {
  const rendererFactory = useService(RendererFactory);

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
  sections: PropTypes.arrayOf(sectionShape).isRequired
};

DocView.defaultProps = {
  onAction: null
};

module.exports = DocView;
