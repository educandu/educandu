import by from 'thenby';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Table, Tooltip } from 'antd';
import prettyBytes from 'pretty-bytes';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FolderIcon from './icons/files/folder-icon.js';
import DeleteIcon from './icons/general/delete-icon.js';
import PreviewIcon from './icons/general/preview-icon.js';
import { useDateFormat, useLocale } from './locale-context.js';
import { confirmCdnFileDelete } from './confirmation-dialogs.js';
import { getResourceIcon, getResourceType } from '../utils/resource-utils.js';

function FilesListViewer({
  files,
  canDelete,
  canNavigateToParent,
  onDeleteClick,
  onPreviewClick,
  onSelectionChange,
  onNavigateToParentClick
}) {
  const { locale } = useLocale();
  const { t } = useTranslation('');
  const { formatDate } = useDateFormat();
  const [selectedRow, setSelectedRow] = useState(null);

  const getFile = row => row ? files.find(f => f.name === row.name) : null;

  const handleHeaderRowClick = rowIndex => {
    if (rowIndex === 1) {
      onNavigateToParentClick();
    }
  };

  const handleRowClick = row => {
    const newSelectedRow = row.key === selectedRow?.key || selectedRow?.isDirectory ? null : row;

    setSelectedRow(newSelectedRow);
    onSelectionChange(getFile(newSelectedRow));
  };

  const handlePreviewClick = (event, row) => {
    event.stopPropagation();
    onPreviewClick(getFile(row));
  };

  const handleDeleteFile = row => {
    onDeleteClick(getFile(row));
  };

  const handleDeleteClick = (event, row) => {
    event.stopPropagation();
    confirmCdnFileDelete(t, row.name, () => handleDeleteFile(row));
  };

  const renderName = (name, row) => {
    if (row.key === 'navigateToParent') {
      return null;
    }

    const Icon = getResourceIcon({ filePath: row.path, isDirectory: row.isDirectory });
    return (
      <div className="FilesListViewer-fileName" >
        <Icon />
        {name}
      </div>
    );
  };

  const renderActions = (_isDirectory, row) => {
    const classes = classNames('FilesListViewer-actions', { 'are-visible': selectedRow?.key === row.key });

    return (
      <div className={classes}>
        <Tooltip title={t('common:preview')}>
          <a
            className="FilesListViewer-action FilesListViewer-action--preview"
            onClick={event => handlePreviewClick(event, row)}
            >
            <PreviewIcon />
          </a>
        </Tooltip>
        {canDelete && (
          <Tooltip title={t('common:delete')}>
            <a
              className="FilesListViewer-action FilesListViewer-action--delete"
              onClick={event => handleDeleteClick(event, row)}
              >
              <DeleteIcon />
            </a>
          </Tooltip>
        )}
      </div>
    );
  };

  const renderNavigateToParentButton = () => (
    <div className="FilesListViewer-fileName"><FolderIcon />...</div>
  );

  const getRowClassName = row => {
    return row.key === selectedRow?.key ? 'FilesListViewer-row is-selected' : 'FilesListViewer-row';
  };

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
      dataIndex: 'sizeFormatted',
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
    },
    {
      title: () => t('common:actions'),
      dataIndex: 'isDirectory',
      render: renderActions,
      align: 'right'
    }
  ];

  if (canNavigateToParent) {
    columns.forEach(column => {
      column.children = column.dataIndex === 'name'
        ? [{ title: renderNavigateToParentButton, render: renderName, dataIndex: 'name', key: 'navigateToParent' }]
        : [{ dataIndex: column.dataIndex, align: column.align, render: column.render }];
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
      typeTranslated: t(`common:resource_${getResourceType(file.path)}`),
      sizeFormatted: Number.isFinite(file.size) && !file.isDirectory ? prettyBytes(file.size, { locale }) : '---',
      lastModifiedFormatted: file.lastModified && !file.isDirectory ? formatDate(file.lastModified, 'PPp') : '---'
    };
  });

  return (
    <div className="FilesListViewer">
      <Table
        bordered={false}
        pagination={false}
        size="middle"
        columns={columns}
        dataSource={rows}
        rowClassName={getRowClassName}
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
  canDelete: PropTypes.bool,
  canNavigateToParent: PropTypes.bool,
  files: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isDirectory: PropTypes.bool.isRequired
  })).isRequired,
  onDeleteClick: PropTypes.func,
  onNavigateToParentClick: PropTypes.func,
  onPreviewClick: PropTypes.func,
  onSelectionChange: PropTypes.func
};

FilesListViewer.defaultProps = {
  canDelete: false,
  canNavigateToParent: false,
  onDeleteClick: () => {},
  onNavigateToParentClick: () => {},
  onPreviewClick: () => {},
  onSelectionChange: () => {}
};

export default FilesListViewer;
