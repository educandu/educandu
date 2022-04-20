import classNames from 'classnames';
import { INTENT, STATE } from './constants.js';
import React, { Fragment, useState } from 'react';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { AlertOutlined, InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, RightOutlined } from '@ant-design/icons';

export default function AnnotationDisplay({ content }) {
  const { state, intent } = content;

  const [isExpanded, setIsExpanded] = useState(state === STATE.expanded);

  const handleHeaderClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderIntentIcon = () => {
    return (
      <div className="Annotation-intentIcon">
        {intent === INTENT.confirm && <CheckCircleOutlined />}
        {intent === INTENT.inform && <InfoCircleOutlined />}
        {intent === INTENT.warn && <ExclamationCircleOutlined />}
        {intent === INTENT.alert && <AlertOutlined />}
      </div>
    );
  };

  const renderContent = ({ standalone }) => {
    return (
      <div className={classNames('Annotation-content', { 'Annotation-content--standalone': standalone })}>
        {standalone && <div className="Annotation-contentIntentIcon">{renderIntentIcon()}</div>}
        <Markdown renderMedia={content.renderMedia}>{content.text}</Markdown>
      </div>
    );
  };

  return (
    <div className="Annotation">
      {state === STATE.static && !content.title && renderContent({ standalone: true })}

      {state === STATE.static && content.title && (
        <Fragment>
          <div className="Annotation-header is-above-content">
            {renderIntentIcon()}
            {content.title}
          </div>
          {renderContent({ standalone: false })}
        </Fragment>
      )}

      {state !== STATE.static && (
        <Fragment>
          <a className={classNames('Annotation-header ', { 'is-above-content': isExpanded })} onClick={handleHeaderClick}>
            {renderIntentIcon()}
            {content.title}
            <RightOutlined className={classNames('Annotation-headerArrow', { 'is-rotated-downwards': isExpanded })} />
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
