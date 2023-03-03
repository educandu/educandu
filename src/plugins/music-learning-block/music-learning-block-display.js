import React from 'react';
import { BEHAVIOR } from './constants.js';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import Collapsible from '../../components/collapsible.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MusicLearningBlockIconRenderer from './music-learning-block-icon-renderer.js';

export default function MusicLearningBlockDisplay({ content }) {
  const { t } = useTranslation('musicLearningBlock');

  const { type, colorScheme, behavior, width } = content;

  return (
    <Collapsible
      width={width}
      title={t(`type_${type}`)}
      isCollapsible={behavior !== BEHAVIOR.static}
      isCollapsed={behavior === BEHAVIOR.expandable}
      icon={<MusicLearningBlockIconRenderer type={type} className="MusicLearningBlockDisplay-typeIcon" />}
      className="MusicLearningBlockDisplay"
      headerClassName={`MusicLearningBlock-colorScheme MusicLearningBlock-colorScheme--${colorScheme}`}
      >
      <Markdown>{content.text}</Markdown>
    </Collapsible>
  );
}

MusicLearningBlockDisplay.propTypes = {
  ...sectionDisplayProps
};
