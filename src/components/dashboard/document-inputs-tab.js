import React from 'react';
import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import Markdown from '../markdown.js';
import { Button, Tooltip } from 'antd';
import EmptyState from '../empty-state.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { CommentOutlined } from '@ant-design/icons';
import { useDateFormat } from '../locale-context.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import InputsIcon from '../icons/general/inputs-icon.js';
import { documentInputShape } from '../../ui/default-prop-types.js';
import { confirmDocumentInputDelete } from '../confirmation-dialogs.js';

function DocumentInputsTab({ loading, documentInputs, onDeleteDocumentInput }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInputsTab');

  const showNoDataEmptyState = !documentInputs.length;

  const handleDocumentInputDeleteClick = documentInput => {
    confirmDocumentInputDelete(
      t,
      formatDate(documentInput.createdOn),
      () => onDeleteDocumentInput(documentInput)
    );
  };

  return (
    <div className="DocumentInputsTab">
      <section>
        {!!loading && <Spinner />}

        {!loading && !!showNoDataEmptyState && (
          <EmptyState
            icon={<InputsIcon />}
            title={t('emptyStateTitle')}
            subtitle={
              <Markdown>{t('emptyStateSubtitle')}</Markdown>
            }
            />
        )}

        {!loading && !showNoDataEmptyState && (
          <div>
            {documentInputs.map(documentInput => {
              const url = routes.getDocumentInputUrl(documentInput._id);
              const commentsCount = Object.values(documentInput.sections)
                .map(sectionData => sectionData.comments)
                .flat().length;

              return (
                <div key={documentInput._id} className="DocumentInputsTab-input">
                  <div className="DocumentInputsTab-inputMetadata">
                    <div className="DocumentInputsTab-inputDate">
                      {formatDate(documentInput.createdOn)}
                    </div>
                    <a href={url}>{documentInput.documentTitle}</a>
                  </div>
                  <div className="DocumentInputsTab-actions">
                    <div className="DocumentInputsTab-comments">
                      <CommentOutlined shape="square" size="large" />
                      <div className="DocumentInputsTab-commentsCount">{commentsCount}</div>
                    </div>
                    <Tooltip title={t('common:delete')}>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteIcon />}
                        className="u-action-button u-danger-action-button"
                        onClick={() => handleDocumentInputDeleteClick(documentInput)}
                        />
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

DocumentInputsTab.propTypes = {
  loading: PropTypes.bool.isRequired,
  documentInputs: PropTypes.arrayOf(documentInputShape).isRequired,
  onDeleteDocumentInput: PropTypes.func.isRequired
};

export default DocumentInputsTab;
