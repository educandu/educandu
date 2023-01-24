import PropTypes from 'prop-types';
import Markdown from './markdown.js';
import routes from '../utils/routes.js';
import Restricted from './restricted.js';
import { useUser } from './user-context.js';
import DeleteButton from './delete-button.js';
import { Button, Collapse, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './markdown-input.js';
import EditIcon from './icons/general/edit-icon.js';
import { useDateFormat } from './locale-context.js';
import { commentShape } from '../ui/default-prop-types.js';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { confirmCommentDelete } from './confirmation-dialogs.js';
import { groupCommentsByTopic } from '../utils/comment-utils.js';
import React, { Fragment, useState, useMemo, useEffect } from 'react';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { maxCommentTextLength, maxCommentTopicLength } from '../domain/validation-constants.js';

const { Panel } = Collapse;

const MODE = {
  read: 'read',
  write: 'write'
};

const NEW_TOPIC_PANEL_KEY = 'newTopic';

function CommentsPanel({ comments, loading, onCommentPostClick, onTopicChangeClick, onCommentDeleteClick }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('commentsPanel');

  const [mode, setMode] = useState(MODE.read);
  const [newTopic, setNewTopic] = useState('');
  const [editedTopic, setEditedTopic] = useState('');
  const [currentComment, setCurrentComment] = useState('');
  const [topicToReExpand, setTopicToReExpand] = useState('');
  const [editedTopicNewText, setEditedTopicNewText] = useState('');
  const [expandedTopic, setExpandedTopic] = useState(NEW_TOPIC_PANEL_KEY);
  const commentGroups = useMemo(() => groupCommentsByTopic(comments), [comments]);

  useEffect(() => {
    setExpandedTopic(topicToReExpand || NEW_TOPIC_PANEL_KEY);
  }, [topicToReExpand]);

  const handleCollapseChange = panelTopic => {
    setMode(MODE.read);
    setCurrentComment('');
    setExpandedTopic(panelTopic);
  };

  const handleAddCommentClick = () => {
    setMode(MODE.write);
  };

  const handlePostCommentClick = () => {
    const newComment = {
      topic: expandedTopic === NEW_TOPIC_PANEL_KEY ? newTopic.trim() : expandedTopic,
      text: currentComment.trim()
    };
    setNewTopic('');
    setMode(MODE.read);
    setCurrentComment('');
    setTopicToReExpand(newComment.topic);

    onCommentPostClick(newComment);
  };

  const handleCurrentCommentChange = event => {
    const { value } = event.target;
    setCurrentComment(value);
  };

  const handleTopicInputClick = event => {
    event.stopPropagation();
  };

  const handleNewTopicChange = event => {
    const { value } = event.target;
    setNewTopic(value);
  };

  const handleEditTopicClick = (event, topic) => {
    event.stopPropagation();
    setEditedTopic(topic);
    setEditedTopicNewText(topic);
  };

  const handleEditedTopicChange = event => {
    const { value } = event.target;
    setEditedTopicNewText(value);
  };

  const handleCancelEditedTopicClick = event => {
    event.stopPropagation();
    setEditedTopic('');
    setEditedTopicNewText('');
  };

  const handleSaveEditedTopicClick = event => {
    event.stopPropagation();
    const newTopicText = editedTopicNewText.trim();
    const isEditingExistingTopic = editedTopic !== newTopicText;
    const isEditingExpandedTopic = editedTopic === expandedTopic;

    if (isEditingExistingTopic) {
      if (isEditingExpandedTopic) {
        setTopicToReExpand(newTopicText);
      }

      onTopicChangeClick({ oldTopic: editedTopic, newTopic: newTopicText });
    }
    setEditedTopic('');
    setEditedTopicNewText('');
  };

  const handleDeleteCommentClick = comment => {
    const author = comment.createdBy.displayName;
    const timestamp = formatDate(comment.createdOn);
    confirmCommentDelete(t, author, timestamp, () => onCommentDeleteClick(comment._id));
  };

  const renderComment = comment => {
    const userUrl = routes.getUserUrl(comment.createdBy._id);
    return (
      <div className="CommentsPanel-comment" key={comment._id}>
        <div className="CommentsPanel-metadata">
          <a href={userUrl}>{comment.createdBy.displayName}</a>
          <div className="CommentsPanel-date">{formatDate(comment.createdOn)}</div>
        </div>
        {!comment.deletedOn && (
          <div className="CommentsPanel-text">
            <Markdown>{comment.text}</Markdown>
          </div>
        )}
        {!!comment.deletedOn && (
          <div className="CommentsPanel-text CommentsPanel-text--deleted">
            {t('commentDeleted')}
          </div>
        )}
        <Restricted to={permissions.MANAGE_DOCUMENT_COMMENTS}>
          <div className="CommentsPanel-commentDeleteButton">
            <DeleteButton onClick={() => handleDeleteCommentClick(comment)} disabled={comment.deletedOn} />
          </div>
        </Restricted>
      </div>
    );
  };

  const renderTopicHeader = topic => {
    return (
      <div className="CommentsPanel-topicHeader">
        <div className="CommentsPanel-topicInputPrefix">{t('topicHeaderPrefix')}:</div>
        {topic === editedTopic && (
          <div className="CommentsPanel-topicInput CommentsPanel-topicInput--edit" onClick={handleTopicInputClick}>
            <MarkdownInput
              inline
              value={editedTopicNewText}
              onChange={handleEditedTopicChange}
              maxLength={maxCommentTopicLength}
              />
          </div>
        )}
        {topic !== editedTopic && (
          <Markdown inline>{topic}</Markdown>
        )}
      </div>
    );
  };

  const renderEditTopicButton = topic => {
    if (!hasUserPermission(user, permissions.MANAGE_DOCUMENT_COMMENTS)) {
      return null;
    }

    if (topic === editedTopic) {
      return (
        <div className="CommentsPanel-editTopicButtonsGroup">
          <Button
            icon={<CloseOutlined />}
            onClick={handleCancelEditedTopicClick}
            />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveEditedTopicClick}
            disabled={editedTopicNewText.trim().length === 0}
            />
        </div>
      );
    }

    return (
      <Button
        icon={<EditIcon />}
        onClick={event => handleEditTopicClick(event, topic)}
        />
    );
  };

  const renderTopicPanel = topic => {
    return (
      <Panel
        key={topic}
        className="CommentsPanel-topicPanel"
        header={renderTopicHeader(topic)}
        extra={renderEditTopicButton(topic)}
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
        key={NEW_TOPIC_PANEL_KEY}
        className="CommentsPanel-topicPanel"
        header={
          <div className="CommentsPanel-topicHeader">
            <div className="CommentsPanel-topicInputPrefix">{t('topicHeaderPrefix')}:</div>
            <div className="CommentsPanel-topicInput" onClick={handleTopicInputClick}>
              <MarkdownInput
                inline
                value={newTopic}
                onChange={handleNewTopicChange}
                maxLength={maxCommentTopicLength}
                placeholder={t('newTopicPlaceholder')}
                />
            </div>
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
    <Fragment>
      {!!loading && <Spin className="u-spin" />}
      {!loading && (
        <Collapse accordion onChange={handleCollapseChange} className="CommentsPanel" activeKey={expandedTopic}>
          {topics.map(renderTopicPanel)}
          {renderNewTopicPanel()}
        </Collapse>
      )}
    </Fragment>
  );
}

CommentsPanel.propTypes = {
  loading: PropTypes.bool.isRequired,
  comments: PropTypes.arrayOf(commentShape).isRequired,
  onCommentDeleteClick: PropTypes.func.isRequired,
  onCommentPostClick: PropTypes.func.isRequired,
  onTopicChangeClick: PropTypes.func.isRequired
};

export default CommentsPanel;
