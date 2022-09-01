import PropTypes from 'prop-types';
import Markdown from './markdown.js';
import routes from '../utils/routes.js';
import { Button, Collapse } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './markdown-input.js';
import { useDateFormat } from './locale-context.js';
import { commentShape } from '../ui/default-prop-types.js';
import { groupCommentsByTopic } from '../utils/comment-utils.js';
import { maxCommentTextLength } from '../domain/validation-constants.js';

const { Panel } = Collapse;

const MODE = {
  read: 'read',
  writeComment: 'writeComment',
  writeTopic: 'writeTopic'
};

function CommentsPanel({ comments, onCommentPosted }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('commentsPanel');
  const commentGroups = groupCommentsByTopic(comments);

  const [mode, setMode] = useState(MODE.read);
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentComment, setCurrentComment] = useState('');

  const handleCollapseChange = panelIndex => {
    setCurrentTopic(Object.keys(commentGroups)[panelIndex]);
  };

  const handleAddCommentClick = () => {
    setMode(MODE.writeComment);
  };

  const handlePostCommentClick = () => {
    onCommentPosted({
      topic: currentTopic,
      text: currentComment.trim()
    });
    setCurrentComment('');
    setMode(MODE.read);
  };

  const handleCurrentCommentChange = event => {
    const { value } = event.target;
    setCurrentComment(value);
  };

  const renderComment = comment => {
    const userUrl = routes.getUserUrl(comment.createdBy._id);
    return (
      <div className="CommentsPanel-comment" key={comment._id}>
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
      <Panel
        key={index}
        className="CommentsPanel-topicPanel"
        header={<Markdown inline>{topic}</Markdown>}
        >
        {commentGroups[topic].map(renderComment)}
        {mode === MODE.read && (
          <Button
            type="primary"
            className="CommentsPanel-addButton"
            onClick={handleAddCommentClick}
            >
            {t('addCommentButtonText')}
          </Button>
        )}
        {mode === MODE.writeComment && (
          <div className="CommentsPanel-comment">
            <MarkdownInput
              preview
              value={currentComment}
              maxLength={maxCommentTextLength}
              onChange={handleCurrentCommentChange}
              />
            <Button
              type="primary"
              className="CommentsPanel-addButton"
              onClick={handlePostCommentClick}
              disabled={currentComment.trim().length === 0}
              >
              {t('postCommentButtonText')}
            </Button>
          </div>
        )}
      </Panel>
    );
  };

  const topics = Object.keys(commentGroups);

  return (
    <Collapse accordion onChange={handleCollapseChange} className="CommentsPanel">
      {topics.map(renderTopicPanel)}
    </Collapse>
  );
}

CommentsPanel.propTypes = {
  comments: PropTypes.arrayOf(commentShape).isRequired,
  onCommentPosted: PropTypes.func.isRequired
};

export default CommentsPanel;
