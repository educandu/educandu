import classNames from 'classnames';
import { RightOutlined } from '@ant-design/icons';
import { BEHAVIOR, INTENT } from './constants.js';
import React, { Fragment, useState } from 'react';
import Markdown from '../../components/markdown.js';
import AlertIcon from '../../components/icons/general/alert-icon.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import WarningIcon from '../../components/icons/general/warning-icon.js';
import InformationIcon from '../../components/icons/general/information-icon.js';
import ConfirmationIcon from '../../components/icons/general/confirmation-icon.js';

export default function AnnotationDisplay({ content }) {
  const { behavior, intent, width } = content;

  const [isExpanded, setIsExpanded] = useState(behavior === BEHAVIOR.collapsible);

  const handleHeaderClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderIntentIcon = ({ standalone }) => {
    if (intent === INTENT.neutral) {
      return null;
    }

    const iconClasses = classNames({
      'AnnotationDisplay-intentIcon': true,
      'AnnotationDisplay-intentIcon--standalone': standalone
    });

    return (
      <div className={iconClasses}>
        {intent === INTENT.confirm && <ConfirmationIcon />}
        {intent === INTENT.inform && <InformationIcon />}
        {intent === INTENT.warn && <WarningIcon />}
        {intent === INTENT.discourage && <AlertIcon />}
      </div>
    );
  };

  const renderContent = ({ standalone }) => {
    const contentClasses = classNames({
      'AnnotationDisplay-content': true,
      'AnnotationDisplay-content--standalone': standalone,
      'AnnotationDisplay-content--confirm': intent === INTENT.confirm,
      'AnnotationDisplay-content--inform': intent === INTENT.inform,
      'AnnotationDisplay-content--warn': intent === INTENT.warn,
      'AnnotationDisplay-content--discourage': intent === INTENT.discourage
    });

    return (
      <div className={contentClasses}>
        {standalone && renderIntentIcon({ standalone: true })}
        <Markdown renderMedia={content.renderMedia}>{content.text}</Markdown>
      </div>
    );
  };

  const headerClasses = classNames({
    'AnnotationDisplay-header': true,
    'AnnotationDisplay-header--confirm': intent === INTENT.confirm,
    'AnnotationDisplay-header--inform': intent === INTENT.inform,
    'AnnotationDisplay-header--warn': intent === INTENT.warn,
    'AnnotationDisplay-header--discourage': intent === INTENT.discourage,
    'is-above-content': isExpanded || (behavior === BEHAVIOR.static && content.title)
  });

  return (
    <div className={`AnnotationDisplay u-max-width-${width}`}>
      {behavior === BEHAVIOR.static && !content.title && renderContent({ standalone: true })}

      {behavior === BEHAVIOR.static && content.title && (
        <Fragment>
          <div className={headerClasses}>
            {renderIntentIcon({ standalone: false })}
            {content.title}
          </div>
          {renderContent({ standalone: false })}
        </Fragment>
      )}

      {behavior !== BEHAVIOR.static && (
        <Fragment>
          <a className={headerClasses} onClick={handleHeaderClick}>
            {renderIntentIcon({ standalone: false })}
            {content.title}
            <RightOutlined className={classNames('AnnotationDisplay-headerArrow', { 'is-rotated-downwards': isExpanded })} />
          </a>
          {isExpanded && renderContent({ standalone: false })}
        </Fragment>
      )}
    </div>
  );
}

AnnotationDisplay.propTypes = {
  ...sectionDisplayProps
};
