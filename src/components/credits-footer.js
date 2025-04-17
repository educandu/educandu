import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from './request-context.js';
import LiteralUrlLink from './literal-url-link.js';
import { useSettings } from './settings-context.js';
import { useDateFormat } from './locale-context.js';
import React, { Fragment, useEffect, useState } from 'react';
import { documentShape, documentRevisionShape } from '../ui/default-prop-types.js';

function CreditsFooter({ doc, revision }) {
  if (!doc && !revision) {
    throw new Error('One of \'doc\' or \'revision\' is required by \'CreditsFooter\' component.');
  }

  const request = useRequest();
  const settings = useSettings();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('creditsFooter');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, [setIsMounted]);

  const title = doc?.title || revision?.title;
  const showLicense = !(doc?.roomId || revision?.roomId);

  const currentHost = request.hostInfo.host;
  const citation = t('citation', { title });
  const url = doc
    ? `${request.hostInfo.origin}${routes.getDocUrl({ id: doc._id, slug: doc.slug })}`
    : `${request.hostInfo.origin}${routes.getDocumentRevisionUrl(revision._id)}`;

  const date = formatDate(request.timestamp);

  const renderUrl = () => <LiteralUrlLink href={url} targetBlank />;

  const renderUser = user => {
    return <a href={routes.getUserProfileUrl(user._id)}>{user.displayName}</a>;
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

    return <span><b>{t('common:contributionsBy')}:</b> {mappedContributors}</span>;
  };

  const renderRevisionAuthor = () => (
    <span><b>{t('versionCreatedBy')}:</b> {renderUser(revision.createdBy)}</span>
  );

  return (
    <div className="CreditsFooter">
      {!!isMounted && (
        <p>
          {!!showLicense && !!settings.license?.name && !!settings.license?.url && (
            <Fragment>
              <b>{t('license')}:</b> <a href={settings.license.url}>{settings.license.name}</a>
              <br />
            </Fragment>
          )}
          <b>{t('quoting')}:</b> <i>{currentHost}</i>, {citation}, {renderUrl()}, {date}
          <br />
          {!!doc && renderDocumentContributors()}
          {!!revision && renderRevisionAuthor()}
        </p>
      )}
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
