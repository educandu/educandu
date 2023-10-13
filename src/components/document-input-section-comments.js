import PropTypes from 'prop-types';
import Markdown from './markdown.js';
import routes from '../utils/routes.js';
import React, { useState } from 'react';
import { Button, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './markdown-input.js';
import { useDateFormat } from './locale-context.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { documentInputSectionCommentShape } from '../ui/default-prop-types.js';
import DocumentInputApiClient from '../api-clients/document-input-api-client.js';

const CollapsePanel = Collapse.Panel;

function DocumentInputSectionComments({ documentInputId, sectionKey, comments }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInputSectionComments');
  const [currentComment, setCurrentComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const documentInputApiClient = useSessionAwareApiClient(DocumentInputApiClient);

  const handleCurrentCommentChange = event => {
    const { value } = event.target;
    setCurrentComment(value);
  };

  const handlePostCommentClick = async () => {
    setIsPostingComment(true);
    await documentInputApiClient.createDocumentInputSectionComment({
      documentInputId,
      sectionKey,
      text: currentComment.trim()
    });
    setIsPostingComment(false);
    setCurrentComment('');
  };

  const renderComment = comment => {
    const userUrl = routes.getUserProfileUrl(comment.createdBy._id);

    return (
      <div className="DocumentInputSectionComments-comment" key={comment.key}>
        <div className="DocumentInputSectionComments-metadata">
          <a href={userUrl}>{comment.createdBy.displayName}</a>
          <div className="DocumentInputSectionComments-date">{formatDate(comment.createdOn)}</div>
        </div>
        {!comment.deletedOn && (
          <div className="DocumentInputSectionComments-text">
            <Markdown>{comment.text}</Markdown>
          </div>
        )}
        {!!comment.deletedOn && (
          <div className="DocumentInputSectionComments-text DocumentInputSectionComments-text--deleted">
            {t('commentDeleted')}
          </div>
        )}
      </div>
    );
  };

  const renderPostCommentSection = () => {
    const isPostingDisabled = currentComment.trim().length === 0;
    const showAsLoading = !isPostingDisabled && isPostingComment;

    return (
      <div className="DocumentInputSectionComments-postComment">
        <MarkdownInput
          preview
          value={currentComment}
          disableResourceSelector
          readOnly={showAsLoading}
          placeholder={t('common:newCommentPlaceholder')}
          onChange={handleCurrentCommentChange}
          />
        <Button
          type="primary"
          className="DocumentInputSectionComments-postCommentButton"
          onClick={handlePostCommentClick}
          loading={showAsLoading}
          disabled={isPostingDisabled}
          >
          {t('common:postCommentButtonText')}
        </Button>
      </div>
    );
  };

  return (
    <div className="DocumentInputSectionComments">
      <Collapse>
        <CollapsePanel header={t('smth')}>
          {comments.map(renderComment)}
          {renderPostCommentSection()}
        </CollapsePanel>
      </Collapse>
    </div>
  );
}

DocumentInputSectionComments.propTypes = {
  documentInputId: PropTypes.string.isRequired,
  sectionKey: PropTypes.string.isRequired,
  comments: PropTypes.arrayOf(documentInputSectionCommentShape).isRequired
};

export default DocumentInputSectionComments;
