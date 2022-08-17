import by from 'thenby';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Table, Tooltip } from 'antd';
import prettyBytes from 'pretty-bytes';
import { useTranslation } from 'react-i18next';
import DeleteIcon from './icons/general/delete-icon.js';
import { CDN_OBJECT_TYPE } from '../domain/constants.js';
import PreviewIcon from './icons/general/preview-icon.js';
import DimensionsProvider from './dimensions-provider.js';
import { cdnObjectShape } from '../ui/default-prop-types.js';
import { useDateFormat, useLocale } from './locale-context.js';
import { confirmCdnFileDelete } from './confirmation-dialogs.js';
import FolderNavigateIcon from './icons/files/folder-navigate-icon.js';
import { getResourceIcon, getResourceType } from '../utils/resource-utils.js';

const HEADER_ROW_HEIGHT_IN_PX = 47;

function FilesListViewer({
  files,
  parentDirectory,
  selectedFileUrl,
  canDelete,
  canNavigateToParent,
  onFileClick,
  onFileDoubleClick,
  onDeleteFileClick,
  onPreviewFileClick,
  onNavigateToParentClick
}) {
  const { uiLocale } = useLocale();
  const { t } = useTranslation('');
  const { formatDate } = useDateFormat();

  const getFile = row => row ? files.find(file => file.portableUrl === row.key) : null;

  const handleHeaderRowClick = rowIndex => {
    if (rowIndex === 1) {
      onNavigateToParentClick();
    }
  };

  const handleRowClick = row => {
    onFileClick(getFile(row));
  };

  const handleRowDoubleClick = row => {
    onFileDoubleClick(getFile(row));
  };

  const handlePreviewClick = (event, row) => {
    event.stopPropagation();
    onPreviewFileClick(getFile(row));
  };

  const handleDeleteFile = row => {
    onDeleteFileClick(getFile(row));
  };

  const handleDeleteClick = (event, row) => {
    event.stopPropagation();
    confirmCdnFileDelete(t, row.name, () => handleDeleteFile(row));
  };

  const renderName = (name, row) => {
    if (row.key === 'navigateToParent') {
      return null;
    }

    const Icon = getResourceIcon({ url: row.url, isDirectory: row.isDirectory });
    return (
      <div className="FilesListViewer-fileNameCell" >
        <Icon />
        <div className="FilesListViewer-fileName">{name}</div>
      </div>
    );
  };

  const renderActions = (_isDirectory, row) => {
    const classes = classNames('FilesListViewer-actions', { 'are-visible': selectedFileUrl === row.key });

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
    <div
      className="FilesListViewer-fileNameCell FilesListViewer-fileNameCell--parentLink"
      >
      <FolderNavigateIcon />
      <div className="FilesListViewer-fileName">{parentDirectory?.displayName || '..'}</div>
    </div>
  );

  const getRowClassName = row => {
    return row.key === selectedFileUrl ? 'FilesListViewer-row is-selected' : 'FilesListViewer-row';
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
      dataIndex: 'createdOnFormatted',
      align: 'right',
      width: 170,
      responsive: ['md'],
      sorter: by('createdOn')
    },
    {
      title: () => t('common:actions'),
      dataIndex: 'isDirectory',
      render: renderActions,
      width: 100,
      align: 'right'
    }
  ];

  if (canNavigateToParent) {
    columns.forEach(column => {
      column.children = column.dataIndex === 'name'
        ? [{ title: renderNavigateToParentButton, render: renderName, dataIndex: 'name', key: 'navigateToParent' }]
        : [{ ...column, title: null, sorter: null }];
    });
  }

  const rows = files.map(file => {
    const isDirectory = file.type === CDN_OBJECT_TYPE.directory;
    return {
      key: file.portableUrl,
      name: file.displayName,
      size: file.size,
      isDirectory,
      createdOn: file.createdOn,
      typeTranslated: t(isDirectory ? 'common:folder' : `common:resource_${getResourceType(file.url)}`),
      sizeFormatted: Number.isFinite(file.size) ? prettyBytes(file.size, { locale: uiLocale }) : '---',
      createdOnFormatted: file.createdOn ? formatDate(file.createdOn, 'PPp') : '---'
    };
  });

  return (
    <div className="FilesListViewer">
      <DimensionsProvider>
        {({ containerHeight }) => {
          const scrollY = containerHeight - (canNavigateToParent ? 2 * HEADER_ROW_HEIGHT_IN_PX : HEADER_ROW_HEIGHT_IN_PX);
          return (
            <Table
              style={{ width: '100%' }}
              bordered={false}
              pagination={false}
              size="middle"
              columns={columns}
              dataSource={rows}
              rowClassName={getRowClassName}
              onRow={row => ({
                onClick: () => handleRowClick(row),
                onDoubleClick: () => handleRowDoubleClick(row)
              })}
              onHeaderRow={(_columns, rowIndex) => ({
                onClick: () => handleHeaderRowClick(rowIndex)
              })}
              scroll={{ y: scrollY }}
              />
          );
        }}
      </DimensionsProvider>
    </div>
  );
}

FilesListViewer.propTypes = {
  canDelete: PropTypes.bool,
  canNavigateToParent: PropTypes.bool,
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  onDeleteFileClick: PropTypes.func,
  onFileClick: PropTypes.func,
  onFileDoubleClick: PropTypes.func,
  onNavigateToParentClick: PropTypes.func,
  onPreviewFileClick: PropTypes.func,
  parentDirectory: cdnObjectShape,
  selectedFileUrl: PropTypes.string
};

FilesListViewer.defaultProps = {
  canDelete: false,
  canNavigateToParent: false,
  onDeleteFileClick: () => {},
  onFileClick: () => {},
  onFileDoubleClick: () => {},
  onNavigateToParentClick: () => {},
  onPreviewFileClick: () => {},
  parentDirectory: null,
  selectedFileUrl: null
};

export default FilesListViewer;
