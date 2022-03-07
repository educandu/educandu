import React from 'react';
import PropTypes from 'prop-types';
import { Table as AntdTable } from 'antd';
import { useTranslation } from 'react-i18next';

export default function Table({ className, pagination, ...tableProps }) {
  const { t } = useTranslation('table');

  const itemRender = (current, type, originalElement) => {
    switch (type) {
      case 'prev':
        return <span className="Table-paginationItemContent Table-paginationItemContent--prevNext">{t('prev')}</span>;
      case 'next':
        return <span className="Table-paginationItemContent Table-paginationItemContent--prevNext">{t('next')}</span>;
      case 'page':
        return <span className="Table-paginationItemContent Table-paginationItemContent--page">{current}</span>;
      default:
        return originalElement;
    }
  };

  return (
    <AntdTable
      className={['Table', className].filter(x => x).join(' ')}
      pagination={pagination && { position: ['bottomCenter'], showSizeChanger: false, itemRender }}
      size="large"
      {...tableProps}
      />
  );
}

Table.propTypes = {
  className: PropTypes.string,
  pagination: PropTypes.bool
};

Table.defaultProps = {
  className: null,
  pagination: false
};
