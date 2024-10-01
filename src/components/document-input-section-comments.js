import PropTypes from 'prop-types';
import Markdown from './markdown.js';
import routes from '../utils/routes.js';
import { Button, Collapse } from 'antd';
import { useUser } from './user-context.js';
import DeleteButton from './delete-button.js';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './markdown-input.js';
import { useDateFormat } from './locale-context.js';
import React, { Fragment, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { documentInputSectionCommentShape } from '../ui/default-prop-types.js';
import DocumentInputApiClient from '../api-clients/document-input-api-client.js';
import { confirmDocumentInputSectionCommentDelete } from './confirmation-dialogs.js';

function DocumentInputSectionComments({ documentInputId, sectionKey, initialComments }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInputSectionComments');
  const documentInputApiClient = useSessionAwareApiClient(DocumentInputApiClient);

  const [currentComment, setCurrentComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [comments, setComments] = useState(cloneDeep(initialComments));

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleCurrentCommentChange = event => {
    const { value } = event.target;
    setCurrentComment(value);
  };

  const handlePostCommentClick = async () => {
    setIsPostingComment(true);
    const response = await documentInputApiClient.createDocumentInputSectionComment({
      documentInputId,
      sectionKey,
      text: currentComment.trim()
    });
    setIsPostingComment(false);
    setCurrentComment('');
    setComments(response.documentInput.sections[sectionKey].comments);
  };

  const handleDeleteOwnCommentClick = comment => {
    const timestamp = formatDate(comment.createdOn);
    confirmDocumentInputSectionCommentDelete(t, timestamp, async () => {
      const response = await documentInputApiClient.deleteDocumentInputSectionComment({
        documentInputId,
        sectionKey,
        commentKey: comment.key
      });
      setComments(response.documentInput.sections[sectionKey].comments);
    });
  };

  const renderComment = comment => {
    const userUrl = routes.getUserProfileUrl(comment.createdBy._id);
    const isOwnComment = comment.createdBy._id === user?._id;

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
        { !!isOwnComment && (
          <div className="DocumentInputSectionComments-commentDeleteButton">
            <DeleteButton onClick={() => handleDeleteOwnCommentClick(comment)} disabled={comment.deletedOn} />
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

  const renderCollapseHeader = () => {
    return (
      <div className="DocumentInputSectionComments-collapseHeader">
        {t('comments')}
        <div className="DocumentInputSectionComments-collapseHeaderComments">
          <div className="m-comments-count">{comments.length}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="DocumentInputSectionComments">
      <Collapse
        items={
          [{
            key: '1',
            label: renderCollapseHeader(),
            children: (
              <Fragment>
                {comments.map(renderComment)}
                {renderPostCommentSection()}
              </Fragment>
            )
          }]
        }
        />
    </div>
  );
}

DocumentInputSectionComments.propTypes = {
  documentInputId: PropTypes.string.isRequired,
  sectionKey: PropTypes.string.isRequired,
  initialComments: PropTypes.arrayOf(documentInputSectionCommentShape).isRequired
};

export default DocumentInputSectionComments;
