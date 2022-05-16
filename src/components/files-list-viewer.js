import by from 'thenby';
import { Table } from 'antd';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useDateFormat, useLocale } from './locale-context.js';
import { getResourceIcon, getResourceType } from '../utils/resource-utils.js';

function FilesListViewer({ files, canNavigateToParent, onNavigateToParent, onFileClick }) {
  const { locale } = useLocale();
  const { t } = useTranslation('');
  const { formatDate } = useDateFormat();

  const renderName = (name, row) => {
    if (row.key === 'navigateToParent') {
      return null;
    }

    const Icon = getResourceIcon({ filePath: row.path, isDirectory: row.isDirectory });
    return (
      <Fragment>
        <Icon className="FilesListViewer-fileIcon" />
        {name}
      </Fragment>
    );
  };

  const renderNavigateToParentButton = () => (
    <span><FolderOpenOutlined className="FilesListViewer-fileIcon" />...</span>
  );

  const columns = [
    {
      title: () => t('common:name'),
      dataIndex: 'name',
      render: renderName,
      sorter: by('isDirectory', { direction: -1 }).thenBy('name', { ignoreCase: true }),
      defaultSortOrder: 'ascend'
    },
    {
      title: () => t('common:type'),
      dataIndex: 'typeTranslated',
      width: 100,
      responsive: ['sm'],
      sorter: by('typeTranslated', { ignoreCase: true })
    },
    {
      title: () => t('common:size'),
      dataIndex: 'sizeFormatter',
      align: 'right',
      width: 100,
      responsive: ['sm'],
      sorter: by('size')
    },
    {
      title: () => t('common:date'),
      dataIndex: 'lastModifiedFormatted',
      align: 'right',
      width: 200,
      responsive: ['md'],
      sorter: by('lastModified')
    }
  ];

  if (canNavigateToParent) {
    columns.forEach(column => {
      column.children = column.dataIndex === 'name'
        ? [{ title: renderNavigateToParentButton, render: renderName, dataIndex: 'name', key: 'navigateToParent' }]
        : [{ dataIndex: column.dataIndex, align: column.align }];
    });
  }

  const rows = files.map(file => {
    return {
      key: file.name,
      name: file.name,
      path: file.path,
      size: file.size,
      isDirectory: file.isDirectory,
      lastModified: file.lastModified,
      typeTranslated: t(`common:${getResourceType(file.path)}Resource`),
      sizeFormatter: Number.isFinite(file.size) && !file.isDirectory ? prettyBytes(file.size, { locale }) : '---',
      lastModifiedFormatted: file.lastModified && !file.isDirectory ? formatDate(file.lastModified, 'PPp') : '---'
    };
  });

  const handleHeaderRowClick = rowIndex => {
    if (rowIndex === 1) {
      onNavigateToParent();
    }
  };

  const handleRowClick = row => {
    const file = files.find(f => f.path === row.path);
    onFileClick(file);
  };

  return (
    <div className="FilesListViewer">
      <Table
        bordered={false}
        pagination={false}
        size="middle"
        columns={columns}
        dataSource={rows}
        onRow={row => ({
          onClick: () => handleRowClick(row)
        })}
        onHeaderRow={(_columns, rowIndex) => ({
          onClick: () => handleHeaderRowClick(rowIndex)
        })}
        />
    </div>
  );
}

FilesListViewer.propTypes = {
  canNavigateToParent: PropTypes.bool,
  files: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isDirectory: PropTypes.bool.isRequired
  })).isRequired,
  onFileClick: PropTypes.func,
  onNavigateToParent: PropTypes.func
};

FilesListViewer.defaultProps = {
  canNavigateToParent: false,
  onFileClick: () => {},
  onNavigateToParent: () => {}
};

export default FilesListViewer;
