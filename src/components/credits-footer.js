import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from './request-context';
import { useLanguage } from './language-context';
import { documentShape, documentRevisionShape } from '../ui/default-prop-types';

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
  const { locale } = useLanguage();
  const { t } = useTranslation('creditsFooter');

  const currentHost = request.hostInfo.host;
  const url = `${request.hostInfo.origin}${request.path}`;
  const citation = t('citation', { title: documentOrRevision.title, url, date: moment().locale(locale).format('L, LT') });

  return (
    <div className="CreditsFooter">
      <p>
        <b>{t('license')}:</b> <a href="https://creativecommons.org/licenses/by-sa/3.0/de/deed.de">CC BY-SA 3.0 DE</a>
        <br />
        <b>{t('source')}:</b> <i>{currentHost}</i>, {citation}
        <br />
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
