import React from 'react';
import PropTypes from 'prop-types';
import SectionDisplay from './section-display';
import { useService } from './container-context';
import RendererFactory from '../plugins/renderer-factory';
import { docShape, sectionShape } from '../ui/default-prop-types';

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

export default DocView;
