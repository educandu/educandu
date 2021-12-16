import React from 'react';
import { Collapse } from 'antd';
import ClientConfig from '../../../bootstrap/client-config.js';
import { useService } from '../../../components/container-context.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown.js';

const { Panel } = Collapse;

function AnnotationDisplay({ content }) {
  const gfm = useService(GithubFlavoredMarkdown);
  const { cdnRootUrl } = useService(ClientConfig);

  const html = gfm.render(content.text || '', { cdnRootUrl });

  return (
    <Collapse accordion>
      <Panel header={content.title || '\u00A0'} key="1">
        <p className="Annotation" dangerouslySetInnerHTML={{ __html: html }} />
      </Panel>
    </Collapse>
  );
}

AnnotationDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AnnotationDisplay;
