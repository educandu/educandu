import React from 'react';
import { Collapse } from 'antd';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { inject } from '../../../components/container-context';
import { sectionDisplayProps } from '../../../ui/default-prop-types';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown';

const { Panel } = Collapse;

class AnnotationDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  render() {
    const { content, githubFlavoredMarkdown } = this.props;
    const html = githubFlavoredMarkdown.render(content.text || '');

    return (
      <Collapse accordion>
        <Panel header={content.title || '\u00A0'} key="1">
          <p className="Annotation" dangerouslySetInnerHTML={{ __html: html }} />
        </Panel>
      </Collapse>
    );
  }
}

AnnotationDisplay.propTypes = {
  ...sectionDisplayProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

export default inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, AnnotationDisplay);
