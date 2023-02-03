import React from 'react';
import PropTypes from 'prop-types';
import { Table as AntdTable } from 'antd';

function DocumentsTable({ className, ...tableProps }) {
  return (
    <AntdTable
      className={['DocumentsTable', className].filter(x => x).join(' ')}
      rowClassName={() => 'DocumentsTable-row'}
      {...tableProps}
      />
  );
}

DocumentsTable.propTypes = {
  className: PropTypes.string
};

DocumentsTable.defaultProps = {
  className: null
};

export default DocumentsTable;
