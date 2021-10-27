import React from 'react';
import Page from '../page';
import PropTypes from 'prop-types';
import moment from 'moment';
import { firstBy } from 'thenby';

import { Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { searchResultShape } from '../../ui/default-prop-types';
import { useLanguage } from '../language-context';
import urls from '../../utils/urls';

function Search({ initialState }) {
  const { t } = useTranslation('search');
  const { locale } = useLanguage();
  const { docs } = initialState;
  const renderContributors = value => (<div>{value?.length}</div>);

  const renderUpdatedOn = (_value, doc) => {
    const date = moment(doc.updatedOn).locale(locale);
    return <span>{date.format('L, LT')}</span>;
  };

  const renderTitle = (title, doc) => {
    const url = urls.getArticleUrl(doc.slug);
    return <a href={url}>{title}</a>;
  };

  const columns = [
    {
      title: t('title'),
      dataIndex: 'title',
      key: 'title',
      render: renderTitle
    },
    {
      title: t('numberOfContributors'),
      dataIndex: 'contributors',
      render: renderContributors
    },
    {
      title: t('tags'),
      dataIndex: 'tags',
      render: (tags, doc) => tags.map(tag => (<Tag key={`${doc.key}_${tag}`}>{tag}</Tag>))
    },
    {
      title: t('udateDate'),
      dataIndex: 'updatedOn',
      render: renderUpdatedOn
    }
  ];

  return (
    <Page headerActions={[]}>
      <Table
        bordered={false}
        pagination={false}
        size="middle"
        columns={columns}
        dataSource={docs.sort(firstBy(doc => doc.contributors)
          .thenBy(doc => doc.updatedOn, 'desc'))}
        />
    </Page>
  );
}

Search.propTypes = {
  initialState: PropTypes.shape({
    docs: PropTypes.arrayOf(searchResultShape)
  }).isRequired
};

export default Search;
