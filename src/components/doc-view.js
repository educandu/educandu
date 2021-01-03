import React from 'react';
import PropTypes from 'prop-types';
import SectionDisplay from './section-display';
import { useService } from './container-context';
import RendererFactory from '../plugins/renderer-factory';
import { documentShape, documentRevisionShape } from '../ui/default-prop-types';

function DocView({ documentOrRevision, language, onAction }) {
  const rendererFactory = useService(RendererFactory);

  return (
    <article className="DocView">
      {documentOrRevision.sections.map(section => (
        <SectionDisplay
          key={section.key}
          docKey={documentOrRevision.key}
          section={section}
          language={language}
          DisplayComponent={rendererFactory.createRenderer(section.type).getDisplayComponent()}
          onAction={onAction}
          />
      ))}
    </article>
  );
}

DocView.propTypes = {
  documentOrRevision: PropTypes.oneOfType([documentShape, documentRevisionShape]).isRequired,
  language: PropTypes.string.isRequired,
  onAction: PropTypes.func
};

DocView.defaultProps = {
  onAction: null
};

export default DocView;
