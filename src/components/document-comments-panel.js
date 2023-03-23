import PropTypes from 'prop-types';
import Markdown from './markdown.js';
import routes from '../utils/routes.js';
import Restricted from './restricted.js';
import { useUser } from './user-context.js';
import DeleteButton from './delete-button.js';
import { Button, Collapse, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './markdown-input.js';
import React, { useState, useEffect } from 'react';
import EditIcon from './icons/general/edit-icon.js';
import { useDateFormat } from './locale-context.js';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { documentCommentShape } from '../ui/default-prop-types.js';
import { confirmDocumentCommentDelete } from './confirmation-dialogs.js';
import { groupDocumentCommentsByTopic } from '../utils/document-comment-utils.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { maxDocumentCommentTextLength, maxDocumentCommentTopicLength } from '../domain/validation-constants.js';

const { Panel } = Collapse;

const NEW_TOPIC_PANEL_KEY = '__NEW_TOPIC__';

function DocumentCommentsPanel({ documentComments, isLoading, onDocumentCommentPostClick, onTopicChangeClick, onDocumentCommentDeleteClick }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentCommentsPanel');

  const [newTopic, setNewTopic] = useState('');
  const [editedTopic, setEditedTopic] = useState('');
  const [commentGroups, setCommentGroups] = useState({});
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [currentComment, setCurrentComment] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isRenamingTopic, setIsRenamingTopic] = useState(false);
  const [editedTopicNewText, setEditedTopicNewText] = useState('');

  useEffect(() => {
    if (isLoading) {
      setCommentGroups({});
      setExpandedTopic(null);
      return;
    }

    const newCommentGroups = groupDocumentCommentsByTopic(documentComments);
    const newCommentGroupKeys = Object.keys(newCommentGroups);
    setCommentGroups(newCommentGroups);
    setExpandedTopic(previousExpandedTopic => {
      return previousExpandedTopic === NEW_TOPIC_PANEL_KEY || newCommentGroupKeys.includes(previousExpandedTopic)
        ? previousExpandedTopic
        : newCommentGroupKeys[0] || NEW_TOPIC_PANEL_KEY;
    });
  }, [documentComments, isLoading]);

  const handleCollapseChange = panelTopic => {
    setCurrentComment('');
    setExpandedTopic(panelTopic);
  };

  const handlePostCommentClick = async () => {
    const newComment = {
      topic: expandedTopic === NEW_TOPIC_PANEL_KEY ? newTopic.trim() : expandedTopic,
      text: currentComment.trim()
    };

    setIsSavingComment(true);
    await onDocumentCommentPostClick(newComment);
    setIsSavingComment(false);
    setNewTopic('');
    setCurrentComment('');
    setExpandedTopic(newComment.topic);
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

  const handleNewTopicButtonClick = () => {
    setNewTopic('');
    setCurrentComment('');
    setEditedTopic(NEW_TOPIC_PANEL_KEY);
    setExpandedTopic(NEW_TOPIC_PANEL_KEY);
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

  const handleSaveEditedTopicClick = async event => {
    event.stopPropagation();
    const newTopicText = editedTopicNewText.trim();
    const isEditingExistingTopic = editedTopic !== newTopicText;

    if (isEditingExistingTopic) {
      setIsRenamingTopic(true);
      await onTopicChangeClick({ oldTopic: editedTopic, newTopic: newTopicText });
      setIsRenamingTopic(false);
      setExpandedTopic(newTopicText);
    }

    setEditedTopic('');
    setEditedTopicNewText('');
  };

  const handleDeleteCommentClick = comment => {
    const author = comment.createdBy.displayName;
    const timestamp = formatDate(comment.createdOn);
    confirmDocumentCommentDelete(t, author, timestamp, async () => {
      await onDocumentCommentDeleteClick(comment._id);
    });
  };

  const renderComment = comment => {
    const userUrl = routes.getUserProfileUrl(comment.createdBy._id);
    return (
      <div className="DocumentCommentsPanel-comment" key={comment._id}>
        <div className="DocumentCommentsPanel-metadata">
          <a href={userUrl}>{comment.createdBy.displayName}</a>
          <div className="DocumentCommentsPanel-date">{formatDate(comment.createdOn)}</div>
        </div>
        {!comment.deletedOn && (
          <div className="DocumentCommentsPanel-text">
            <Markdown>{comment.text}</Markdown>
          </div>
        )}
        {!!comment.deletedOn && (
          <div className="DocumentCommentsPanel-text DocumentCommentsPanel-text--deleted">
            {t('commentDeleted')}
          </div>
        )}
        <Restricted to={permissions.MANAGE_PUBLIC_CONTENT}>
          <div className="DocumentCommentsPanel-commentDeleteButton">
            <DeleteButton onClick={() => handleDeleteCommentClick(comment)} disabled={comment.deletedOn} />
          </div>
        </Restricted>
      </div>
    );
  };

  const renderTopicHeader = topic => {
    return (
      <div className="DocumentCommentsPanel-topicHeader">
        <div className="DocumentCommentsPanel-topicInputPrefix">{t('topicHeaderPrefix')}:</div>
        {topic === editedTopic && (
          <div className="DocumentCommentsPanel-topicInput DocumentCommentsPanel-topicInput--edit" onClick={handleTopicInputClick}>
            <MarkdownInput
              inline
              value={editedTopicNewText}
              readOnly={isRenamingTopic}
              onChange={handleEditedTopicChange}
              maxLength={maxDocumentCommentTopicLength}
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
    if (!hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT)) {
      return null;
    }

    if (topic === editedTopic) {
      return (
        <div className="DocumentCommentsPanel-editTopicButtonsGroup">
          <Button
            icon={<CloseOutlined />}
            disabled={isRenamingTopic}
            onClick={handleCancelEditedTopicClick}
            />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isRenamingTopic}
            onClick={handleSaveEditedTopicClick}
            disabled={editedTopicNewText.trim().length === 0}
            />
        </div>
      );
    }

    if (topic === expandedTopic) {
      return (
        <Button
          icon={<EditIcon />}
          disabled={isRenamingTopic}
          onClick={event => handleEditTopicClick(event, topic)}
          />
      );
    }

    return null;
  };

  const renderNewCommentSection = topic => {
    const needsNewTopic = topic === NEW_TOPIC_PANEL_KEY && newTopic.trim().length === 0;
    const isPostingDisabled = currentComment.trim().length === 0 || needsNewTopic;
    const showAsLoading = !isPostingDisabled && isSavingComment;
    return (
      <Restricted to={permissions.CREATE_CONTENT}>
        <div className="DocumentCommentsPanel-comment">
          <MarkdownInput
            preview
            value={currentComment}
            readOnly={showAsLoading}
            placeholder={t('newCommentPlaceholder')}
            maxLength={maxDocumentCommentTextLength}
            useStorageSelector={false}
            onChange={handleCurrentCommentChange}
            />
          <Button
            type="primary"
            className="DocumentCommentsPanel-postCommentButton"
            onClick={handlePostCommentClick}
            loading={showAsLoading}
            disabled={isPostingDisabled}
            >
            {t('postCommentButtonText')}
          </Button>
        </div>
      </Restricted>
    );
  };

  const renderTopicPanel = topic => {
    return (
      <Panel
        key={topic}
        className="DocumentCommentsPanel-topicPanel"
        header={renderTopicHeader(topic)}
        extra={renderEditTopicButton(topic)}
        >
        {commentGroups[topic].map(renderComment)}
        {renderNewCommentSection(topic)}
      </Panel>
    );
  };

  const renderNewTopicPanel = () => {
    if (!hasUserPermission(user, permissions.CREATE_CONTENT)) {
      return null;
    }
    const isPostingDisabled = currentComment.trim().length === 0 || newTopic.trim().length === 0;
    const showAsLoading = !isPostingDisabled && isSavingComment;
    return (
      <Panel
        key={NEW_TOPIC_PANEL_KEY}
        className="DocumentCommentsPanel-topicPanel"
        header={
          <div className="DocumentCommentsPanel-topicHeader">
            <div className="DocumentCommentsPanel-topicInputPrefix">{t('newTopicHeaderPrefix')}:</div>
            <div className="DocumentCommentsPanel-topicInput" onClick={handleTopicInputClick}>
              <MarkdownInput
                inline
                autoFocus
                value={newTopic}
                readOnly={showAsLoading}
                onChange={handleNewTopicChange}
                maxLength={maxDocumentCommentTopicLength}
                placeholder={t('newTopicPlaceholder')}
                />
            </div>
          </div>
        }
        >
        {renderNewCommentSection(NEW_TOPIC_PANEL_KEY)}
      </Panel>
    );
  };

  const topics = Object.keys(commentGroups);
  const shouldShowNewTopicPanel = expandedTopic === NEW_TOPIC_PANEL_KEY;
  const userCanWriteComments = hasUserPermission(user, permissions.CREATE_CONTENT);

  if (isLoading) {
    return (
      <div className="DocumentCommentsPanel">
        <Spin className="u-spin" />
      </div>
    );
  }

  return (
    <div className="DocumentCommentsPanel">
      <Collapse accordion onChange={handleCollapseChange} className="DocumentCommentsPanel" activeKey={expandedTopic}>
        {topics.map(renderTopicPanel)}
        {!!userCanWriteComments && !!shouldShowNewTopicPanel && renderNewTopicPanel()}
      </Collapse>
      {!!userCanWriteComments && !shouldShowNewTopicPanel && (
        <Button
          type="primary"
          className="DocumentCommentsPanel-newTopicButton"
          onClick={handleNewTopicButtonClick}
          >
          {t('addNewTopicButtonText')}
        </Button>
      )}
    </div>
  );
}

DocumentCommentsPanel.propTypes = {
  documentComments: PropTypes.arrayOf(documentCommentShape).isRequired,
  isLoading: PropTypes.bool.isRequired,
  onDocumentCommentDeleteClick: PropTypes.func.isRequired,
  onDocumentCommentPostClick: PropTypes.func.isRequired,
  onTopicChangeClick: PropTypes.func.isRequired
};

export default DocumentCommentsPanel;
