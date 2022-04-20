import React from 'react';
import { Collapse, Card } from 'antd';
import { INTENT, STATE } from './constants.js';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { AlertOutlined, InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

export default function AnnotationDisplay({ content }) {
  const { state, intent } = content;
  const collapsePanelKey = 'annotation-panel';

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

  const renderHeader = () => {
    const title = content.title || '\u00A0';
    return (
      <div className="Annotation-header">
        {renderIntentIcon()}
        {title}
      </div>
    );
  };

  const renderContent = ({ withIntentIcon }) => {
    return (
      <div className="Annotation-content">
        {withIntentIcon && <div className="Annotation-contentIntentIcon">{renderIntentIcon()}</div>}
        <Markdown renderMedia={content.renderMedia}>{content.text}</Markdown>
      </div>
    );
  };

  return (
    <div className={`Annotation Annotation--${intent}`}>
      {state === STATE.static && content.title && (
        <Collapse accordion activeKey={collapsePanelKey}>
          <Panel header={renderHeader()} key={collapsePanelKey} showArrow={false}>
            {renderContent({ withIntentIcon: false })}
          </Panel>
        </Collapse>
      )}

      {state === STATE.static && !content.title && (
        <Card>
          {renderContent({ withIntentIcon: true })}
        </Card>
      )}

      {state !== STATE.static && (
        <Collapse accordion expandIconPosition="right" defaultActiveKey={state === STATE.expanded ? collapsePanelKey : null}>
          <Panel header={renderHeader()} key={collapsePanelKey}>
            {renderContent({ withIntentIcon: false })}
          </Panel>
        </Collapse>
      )}
    </div>
  );
}

AnnotationDisplay.propTypes = {
  ...sectionDisplayProps
};
