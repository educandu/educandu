import urls from '../utils/urls.js';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from './request-context.js';
import { useSettings } from './settings-context.js';
import { useDateFormat } from './locale-context.js';
import { documentShape, documentRevisionShape } from '../ui/default-prop-types.js';

const ZERO_WIDTH_SPACE = '\u200B';

function CreditsFooter({ doc, revision }) {
  if (!doc && !revision) {
    throw new Error('One of \'doc\' or \'revision\' is required by \'CreditsFooter\' component.');
  }

  const request = useRequest();
  const settings = useSettings();
  const { t } = useTranslation('creditsFooter');
  const { formatDate } = useDateFormat();

  const title = doc?.title || revision?.title;
  const originalUrl = doc?.originUrl || revision?.originUrl;

  const currentHost = request.hostInfo.host;
  const citation = t('citation', { title });
  const url = doc
    ? `${request.hostInfo.origin}${urls.getDocUrl({ key: doc.key, slug: doc.slug })}`
    : `${request.hostInfo.origin}${urls.getDocumentRevisionUrl(revision._id)}`;

  const date = formatDate(request.timestamp);

  const renderLongUrlText = urlText => {
    const parts = urlText.replace(/[^\w]\b/g, c => `${c}${ZERO_WIDTH_SPACE}`).split(ZERO_WIDTH_SPACE);
    return (
      <Fragment>
        {parts.map((part, index) => (
          <Fragment key={index.toString()}>
            {!!index && <wbr />}
            {part}
          </Fragment>
        ))}
      </Fragment>
    );
  };

  const renderUrl = () => (<a rel="noopener noreferrer" target="_blank" href={url}>{renderLongUrlText(url)}</a>);
  const renderOriginalUrl = () => (<a rel="noopener noreferrer" target="_blank" href={originalUrl}>{renderLongUrlText(originalUrl)}</a>);

  const renderUser = user => {
    return user.email
      ? <a href={`mailto:${user.email}`}>{user.username}</a>
      : <span>{user.username}</span>;
  };

  const renderDocumentContributors = () => {
    if (!doc.contributors.length) {
      return null;
    }

    const mappedContributors = doc.contributors.map((user, index) => (
      <Fragment key={user._id}>
        {index !== 0 && ', '}
        {renderUser(user)}
      </Fragment>
    ));

    return <span><b>{t('contributionsBy')}:</b> {mappedContributors}</span>;
  };

  const renderRevisionAuthor = () => (
    <span><b>{t('revisionBy')}:</b> {renderUser(revision.createdBy)}</span>
  );

  return (
    <div className="CreditsFooter">
      <p>
        {settings.license?.name && settings.license?.url && (
          <Fragment>
            <b>{t('license')}:</b> <a href={settings.license.url}>{settings.license.name}</a>
            <br />
          </Fragment>
        )}
        <b>{t('common:source')}:</b> <i>{currentHost}</i>, {citation}, {renderUrl()}, {date}
        <br />
        {originalUrl && (
          <Fragment>
            <b>{t('originalSource')}:</b> {renderOriginalUrl()}
            <br />
          </Fragment>
        )}
        {doc && renderDocumentContributors()}
        {revision && renderRevisionAuthor()}
      </p>
    </div>
  );
}

CreditsFooter.propTypes = {
  doc: documentShape,
  revision: documentRevisionShape
};

CreditsFooter.defaultProps = {
  doc: null,
  revision: null
};

export default CreditsFooter;
