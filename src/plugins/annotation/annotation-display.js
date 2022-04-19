import React from 'react';
import { Collapse } from 'antd';
import { STATE } from './constants.js';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const { Panel } = Collapse;

export default function AnnotationDisplay({ content }) {
  const { state } = content;
  const panelKey = 'annotation-panel';
  const title = content.title || '\u00A0';

  const renderContentText = () => <Markdown renderMedia={content.renderMedia}>{content.text}</Markdown>;

  return (
    <div className="Annotation">
      {state === STATE.static && (
        <Collapse accordion activeKey={panelKey}>
          <Panel header={title} key={panelKey} showArrow={false}>
            {renderContentText()}
          </Panel>
        </Collapse>
      )}

      {state !== STATE.static && (
        <Collapse accordion defaultActiveKey={state === STATE.expanded ? panelKey : null}>
          <Panel header={title} key={panelKey}>
            {renderContentText()}
          </Panel>
        </Collapse>
      )}
    </div>
  );
}

AnnotationDisplay.propTypes = {
  ...sectionDisplayProps
};
