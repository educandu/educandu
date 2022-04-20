import classNames from 'classnames';
import { INTENT, STATE } from './constants.js';
import React, { Fragment, useState } from 'react';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { AlertOutlined, InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, RightOutlined } from '@ant-design/icons';

export default function AnnotationDisplay({ content }) {
  const { state, intent, width } = content;

  const [isExpanded, setIsExpanded] = useState(state === STATE.expanded);

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
        {intent === INTENT.confirm && <CheckCircleOutlined />}
        {intent === INTENT.inform && <InfoCircleOutlined />}
        {intent === INTENT.warn && <ExclamationCircleOutlined />}
        {intent === INTENT.alert && <AlertOutlined />}
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
      'AnnotationDisplay-content--alert': intent === INTENT.alert
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
    'AnnotationDisplay-header--alert': intent === INTENT.alert,
    'is-above-content': isExpanded || (state === STATE.static && content.title)
  });

  return (
    <div className={`AnnotationDisplay u-max-width-${width}`}>
      {state === STATE.static && !content.title && renderContent({ standalone: true })}

      {state === STATE.static && content.title && (
        <Fragment>
          <div className={headerClasses}>
            {renderIntentIcon({ standalone: false })}
            {content.title}
          </div>
          {renderContent({ standalone: false })}
        </Fragment>
      )}

      {state !== STATE.static && (
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
