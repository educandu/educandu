import React from 'react';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { useRequest } from './request-context';
import { useLanguage } from './language-context';
import { documentShape } from '../ui/default-prop-types';

function ArticleCredits({ doc }) {
  const request = useRequest();
  const { locale } = useLanguage();
  const { t } = useTranslation('articleCredits');

  const contributors = doc.contributors;
  const currentHost = request.hostInfo.host;
  const url = `${request.hostInfo.origin}${request.path}`;
  const citation = t('citation', { title: doc.title, url: url, date: moment().locale(locale).format('L, LT') });

  return (
    <div className="ArticleCredits">
      <p className="ArticleCredits-licence">
        <b>{t('license')}:</b> <a href="https://creativecommons.org/licenses/by-sa/3.0/de/deed.de">CC BY-SA 3.0 DE</a>
        <br />
        <b>{t('source')}:</b> <i>{currentHost}</i>, {citation}
        <br />
        {!!contributors.length && <span><b>{t('contributionsBy')}:</b> <span>{contributors.map(x => x.username).join(', ')}</span></span>}
      </p>
    </div>
  );
}

ArticleCredits.propTypes = {
  doc: documentShape.isRequired
};

export default ArticleCredits;
