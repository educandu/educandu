import React from 'react';
import { BEHAVIOR } from './constants.js';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import Collapsible from '../../components/collapsible.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MusicAccentuationIconRenderer from './music-accentuation-icon-renderer.js';

export default function MusicAccentuationDisplay({ content }) {
  const { t } = useTranslation('musicAccentuation');

  const { type, colorScheme, behavior, width } = content;

  return (
    <Collapsible
      width={width}
      title={t(`type_${type}`)}
      isCollapsible={behavior !== BEHAVIOR.static}
      isCollapsed={behavior === BEHAVIOR.expandable}
      icon={<MusicAccentuationIconRenderer type={type} />}
      className="MusicAccentuationDisplay"
      headerClassName={`MusicAccentuation-colorScheme MusicAccentuation-colorScheme--${colorScheme}`}
      >
      <Markdown>{content.text}</Markdown>
    </Collapsible>
  );
}

MusicAccentuationDisplay.propTypes = {
  ...sectionDisplayProps
};
