import React from 'react';
import { Collapse } from 'antd';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const { Panel } = Collapse;

export default function AnnotationDisplay({ content }) {
  return (
    <div className="Annotation">
      <Collapse accordion>
        <Panel header={content.title || '\u00A0'} key="1">
          <Markdown renderMedia={content.renderMedia}>{content.text}</Markdown>
        </Panel>
      </Collapse>
    </div>
  );
}

AnnotationDisplay.propTypes = {
  ...sectionDisplayProps
};
