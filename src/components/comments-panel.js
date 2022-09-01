import React from 'react';
import PropTypes from 'prop-types';
import Markdown from './markdown.js';
import routes from '../utils/routes.js';
import { Button, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { commentShape } from '../ui/default-prop-types.js';
import { groupCommentsByTopic } from '../utils/doc-utils.js';

const { Panel } = Collapse;

function CommentsPanel({ comments }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('commentsPanel');
  const commentGroups = groupCommentsByTopic(comments);

  const renderComment = comment => {
    const userUrl = routes.getUserUrl(comment.createdBy._id);
    return (
      <div className="CommentsPanel" key={comment._id}>
        <div className="CommentsPanel-metadata">
          <a className="CommentsPanel-author" href={userUrl}>{comment.createdBy.displayName}</a>
          <div className="CommentsPanel-date">{formatDate(comment.createdOn)}</div>
        </div>
        <div className="CommentsPanel-text">
          <Markdown>{comment.text}</Markdown>
        </div>
      </div>
    );
  };

  const renderTopicPanel = (topic, index) => {
    return (
      <Panel header={<Markdown inline>{topic}</Markdown>} key={index}>
        {commentGroups[topic].map(renderComment)}
        <Button type="primary" className="CommentsPanel-addButton">
          {t('addCommentButtonText')}
        </Button>
      </Panel>
    );
  };

  const topics = Object.keys(commentGroups);

  return (
    <Collapse accordion>
      {topics.map(renderTopicPanel)}
    </Collapse>
  );
}

CommentsPanel.propTypes = {
  comments: PropTypes.arrayOf(commentShape).isRequired
};

export default CommentsPanel;
