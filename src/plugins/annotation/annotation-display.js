import React from 'react';
import { BEHAVIOR, INTENT } from './constants.js';
import Markdown from '../../components/markdown.js';
import AlertIcon from '../../components/icons/general/alert-icon.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import WarningIcon from '../../components/icons/general/warning-icon.js';
import InformationIcon from '../../components/icons/general/information-icon.js';
import Collapsible, { COLLAPSIBLE_COLOR } from '../../components/collapsible.js';
import ConfirmationIcon from '../../components/icons/general/confirmation-icon.js';

export default function AnnotationDisplay({ content }) {
  const { behavior, intent, width } = content;

  const getIcon = () => {
    switch (intent) {
      case INTENT.confirm: return <ConfirmationIcon />;
      case INTENT.inform: return <InformationIcon />;
      case INTENT.warn: return <WarningIcon />;
      case INTENT.discourage: return <AlertIcon />;
      case INTENT.neutral:
      default: return null;
    }
  };

  const getColor = () => {
    switch (intent) {
      case INTENT.confirm: return COLLAPSIBLE_COLOR.green;
      case INTENT.inform: return COLLAPSIBLE_COLOR.blue;
      case INTENT.warn: return COLLAPSIBLE_COLOR.orange;
      case INTENT.discourage: return COLLAPSIBLE_COLOR.red;
      case INTENT.neutral:
      default: return null;
    }
  };

  return (
    <Collapsible
      title={<Markdown inline>{content.title}</Markdown>}
      icon={getIcon()}
      color={getColor()}
      width={width}
      isCollapsible={behavior !== BEHAVIOR.static}
      isCollapsed={behavior === BEHAVIOR.expandable}
      >
      <Markdown renderMedia={content.renderMedia}>{content.text}</Markdown>
    </Collapsible>
  );
}

AnnotationDisplay.propTypes = {
  ...sectionDisplayProps
};
