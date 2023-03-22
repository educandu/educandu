import React from 'react';
import { BEHAVIOR } from './constants.js';
import Markdown from '../../components/markdown.js';
import Collapsible from '../../components/collapsible.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MusicAccentuationIconRenderer from './music-accentuation-icon-renderer.js';

export default function MusicAccentuationDisplay({ content }) {
  const { title, icon, colorScheme, behavior, width } = content;

  return (
    <Collapsible
      width={width}
      title={title ? <Markdown inline>{title}</Markdown> : null}
      isCollapsible={behavior !== BEHAVIOR.static}
      isCollapsed={behavior === BEHAVIOR.expandable}
      icon={<MusicAccentuationIconRenderer icon={icon} />}
      customColorSchemeClassName={`MusicAccentuation-colorScheme MusicAccentuation-colorScheme--${colorScheme}`}
      >
      <Markdown>{content.text}</Markdown>
    </Collapsible>
  );
}

MusicAccentuationDisplay.propTypes = {
  ...sectionDisplayProps
};
