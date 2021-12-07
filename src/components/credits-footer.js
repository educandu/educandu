import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from './request-context.js';
import { documentShape, documentRevisionShape } from '../ui/default-prop-types.js';
import { useDateFormat } from './language-context.js';

function renderUser(user) {
  return user.email
    ? <a href={`mailto:${user.email}`}>{user.username}</a>
    : <span>{user.username}</span>;
}

function renderDocumentContributors(doc, t) {
  const cons = doc.contributors.map((user, index) => (
    <Fragment key={index.toString()}>
      {index !== 0 && ', '}
      {renderUser(user)}
    </Fragment>
  ));

  return !!doc.contributors.length && <span><b>{t('contributionsBy')}:</b> {cons}</span>;
}

function renderRevisionAuthor(revision, t) {
  return <span><b>{t('revisionBy')}:</b> {renderUser(revision.createdBy)}</span>;
}

function CreditsFooter({ documentOrRevision, type }) {
  const request = useRequest();
  const { t } = useTranslation('creditsFooter');
  const { formatDate } = useDateFormat();

  const currentHost = request.hostInfo.host;
  const url = `${request.hostInfo.origin}${request.path}`;
  const citation = t('citation', { title: documentOrRevision.title, url, date: formatDate(new Date().toISOString()) });

  return (
    <div className="CreditsFooter">
      <p>
        <b>{t('license')}:</b> <a href="https://creativecommons.org/licenses/by-sa/3.0/de/deed.de">CC BY-SA 3.0 DE</a>
        <br />
        <b>{t('source')}:</b> <i>{currentHost}</i>, {citation}
        <br />
        {documentOrRevision.originUrl && (
          <React.Fragment>
            <b>{t('originalSource')}:</b> <a href={documentOrRevision.originUrl}>{documentOrRevision.originUrl}</a>
            <br />
          </React.Fragment>)}
        {type === 'document' ? renderDocumentContributors(documentOrRevision, t) : renderRevisionAuthor(documentOrRevision, t)}
      </p>
    </div>
  );
}

CreditsFooter.propTypes = {
  documentOrRevision: PropTypes.oneOfType([documentShape, documentRevisionShape]).isRequired,
  type: PropTypes.oneOf(['document', 'revision']).isRequired
};

export default CreditsFooter;
