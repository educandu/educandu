import PropTypes from 'prop-types';
import Markdown from './markdown.js';
import routes from '../utils/routes.js';
import { Button, Collapse } from 'antd';
import React, { useState } from 'react';
import Restricted from './restricted.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './markdown-input.js';
import { useDateFormat } from './locale-context.js';
import { commentShape } from '../ui/default-prop-types.js';
import { groupCommentsByTopic } from '../utils/comment-utils.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { maxCommentTextLength, maxCommentTopicLength } from '../domain/validation-constants.js';

const { Panel } = Collapse;

const MODE = {
  read: 'read',
  write: 'write'
};

function CommentsPanel({ comments, onCommentPosted }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('commentsPanel');
  const commentGroups = groupCommentsByTopic(comments);

  const [mode, setMode] = useState(MODE.read);
  const [newTopic, setNewTopic] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentComment, setCurrentComment] = useState('');

  const handleCollapseChange = panelIndex => {
    setMode(MODE.read);
    setCurrentComment('');
    setCurrentTopic(Object.keys(commentGroups)[panelIndex] || '');
  };

  const handleAddCommentClick = () => {
    setMode(MODE.write);
  };

  const handlePostCommentClick = () => {
    onCommentPosted({
      topic: currentTopic || newTopic.trim(),
      text: currentComment.trim()
    });
    setNewTopic('');
    setCurrentComment('');
    setMode(MODE.read);
  };

  const handleCurrentCommentChange = event => {
    const { value } = event.target;
    setCurrentComment(value);
  };

  const handleNewTopicInputClick = event => {
    event.stopPropagation();
  };

  const handleNewTopicChange = event => {
    const { value } = event.target;
    setNewTopic(value);
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

        <Restricted to={permissions.CREATE_DOCUMENT_COMMENTS}>
          {mode === MODE.read && (
          <Button
            type="primary"
            className="CommentsPanel-addButton"
            onClick={handleAddCommentClick}
            >
            {t('addCommentButtonText')}
          </Button>
          )}
          {mode === MODE.write && (
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
        </Restricted>
      </Panel>
    );
  };

  const renderNewTopicPanel = () => {
    if (!hasUserPermission(user, permissions.CREATE_DOCUMENT_COMMENTS)) {
      return null;
    }
    return (
      <Panel
        key="newTopic"
        className="CommentsPanel-topicPanel CommentsPanel-topicPanel--newTopic"
        header={
          <div className="CommentsPanel-newTopicInput" onClick={handleNewTopicInputClick}>
            <MarkdownInput
              inline
              value={newTopic}
              onChange={handleNewTopicChange}
              maxLength={maxCommentTopicLength}
              placeholder={t('newTopicPlaceholder')}
              />
          </div>
        }
        >
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
          disabled={currentComment.trim().length === 0 || newTopic.trim().length === 0}
          >
          {t('postCommentButtonText')}
        </Button>
      </Panel>
    );
  };

  const topics = Object.keys(commentGroups);

  return (
    <Collapse accordion onChange={handleCollapseChange} className="CommentsPanel">
      {topics.map(renderTopicPanel)}
      {renderNewTopicPanel()}
    </Collapse>
  );
}

CommentsPanel.propTypes = {
  comments: PropTypes.arrayOf(commentShape).isRequired,
  onCommentPosted: PropTypes.func.isRequired
};

export default CommentsPanel;
