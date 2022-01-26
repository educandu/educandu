import React from 'react';
import PropTypes from 'prop-types';
import SectionDisplay from './section-display.js';
import { sectionShape } from '../ui/default-prop-types.js';

function SectionsView({ sections, sectionsContainerId, onAction }) {
  return (
    <article data-document-key={sectionsContainerId}>
      {sections.map(section => (
        <SectionDisplay
          key={section.key}
          section={section}
          onAction={onAction}
          />
      ))}
    </article>
  );
}

SectionsView.propTypes = {
  onAction: PropTypes.func,
  sections: PropTypes.arrayOf(sectionShape).isRequired,
  sectionsContainerId: PropTypes.string.isRequired
};

SectionsView.defaultProps = {
  onAction: null
};

export default SectionsView;
