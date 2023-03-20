import by from 'thenby';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Table, Tooltip } from 'antd';
import prettyBytes from 'pretty-bytes';
import { useTranslation } from 'react-i18next';
import DeleteIcon from '../../icons/general/delete-icon.js';
import PreviewIcon from '../../icons/general/preview-icon.js';
import DimensionsProvider from '../../dimensions-provider.js';
import { cdnObjectShape } from '../../../ui/default-prop-types.js';
import { useDateFormat, useLocale } from '../../locale-context.js';
import { getResourceIcon, getResourceType } from '../../../utils/resource-utils.js';

const HEADER_ROW_HEIGHT_IN_PX = 47;

function FilesListViewer({
  files,
  selectedFileUrl,
  canDelete,
  onFileClick,
  onFileDoubleClick,
  onDeleteFileClick,
  onPreviewFileClick
}) {
  const { uiLocale } = useLocale();
  const { t } = useTranslation('');
  const { formatDate } = useDateFormat();

  const getFile = row => row ? files.find(file => file.portableUrl === row.key) : null;

  const handleRowClick = row => {
    onFileClick(getFile(row));
  };

  const handleRowDoubleClick = row => {
    onFileDoubleClick(getFile(row));
  };

  const handlePreviewFileClick = (event, row) => {
    event.stopPropagation();
    onPreviewFileClick(getFile(row));
  };

  const handleDeleteFileClick = (event, row) => {
    event.stopPropagation();
    onDeleteFileClick(getFile(row));
  };

  const renderName = (name, row) => {
    if (row.key === 'navigateToParent') {
      return null;
    }

    const Icon = getResourceIcon({ url: row.url });
    return (
      <Tooltip title={name}>
        <div className="FilesListViewer-fileNameCell" >
          <Icon />
          <div className="FilesListViewer-fileName">{name}</div>
        </div>
      </Tooltip>
    );
  };

  const renderActions = (_actions, row) => {
    const classes = classNames('FilesListViewer-actions', { 'are-visible': selectedFileUrl === row.key });

    return (
      <div className={classes}>
        <Tooltip title={t('common:preview')}>
          <a
            className="FilesListViewer-action FilesListViewer-action--preview"
            onClick={event => handlePreviewFileClick(event, row)}
            >
            <PreviewIcon />
          </a>
        </Tooltip>
        {!!canDelete && (
          <Tooltip title={t('common:delete')}>
            <a
              className="FilesListViewer-action FilesListViewer-action--delete"
              onClick={event => handleDeleteFileClick(event, row)}
              >
              <DeleteIcon />
            </a>
          </Tooltip>
        )}
      </div>
    );
  };

  const getRowClassName = row => {
    return row.key === selectedFileUrl ? 'FilesListViewer-row is-selected' : 'FilesListViewer-row';
  };

  const columns = [
    {
      title: () => t('common:name'),
      dataIndex: 'name',
      render: renderName,
      sorter: by('name', { ignoreCase: true }),
      defaultSortOrder: 'ascend'
    },
    {
      title: () => t('common:type'),
      dataIndex: 'typeTranslated',
      width: 100,
      responsive: ['lg'],
      sorter: by('typeTranslated', { ignoreCase: true })
    },
    {
      title: () => t('common:size'),
      dataIndex: 'sizeFormatted',
      align: 'right',
      width: 100,
      responsive: ['md'],
      sorter: by('size')
    },
    {
      title: () => t('common:date'),
      dataIndex: 'createdOnFormatted',
      align: 'right',
      width: 170,
      responsive: ['lg'],
      sorter: by('createdOn')
    },
    {
      title: () => t('common:actions'),
      dataIndex: 'actions',
      render: renderActions,
      width: 100,
      align: 'right'
    }
  ];

  const rows = files.map(file => {
    return {
      key: file.portableUrl,
      name: file.name,
      size: file.size,
      createdOn: file.createdOn,
      typeTranslated: t(`common:resource_${getResourceType(file.url)}`),
      sizeFormatted: Number.isFinite(file.size) ? prettyBytes(file.size, { locale: uiLocale }) : '---',
      createdOnFormatted: file.createdOn ? formatDate(file.createdOn, 'PPp') : '---'
    };
  });

  return (
    <div className="FilesListViewer">
      <DimensionsProvider>
        {({ containerHeight }) => {
          const scrollY = containerHeight - HEADER_ROW_HEIGHT_IN_PX;
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
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  onDeleteFileClick: PropTypes.func,
  onFileClick: PropTypes.func,
  onFileDoubleClick: PropTypes.func,
  onPreviewFileClick: PropTypes.func,
  selectedFileUrl: PropTypes.string
};

FilesListViewer.defaultProps = {
  canDelete: false,
  onDeleteFileClick: () => {},
  onFileClick: () => {},
  onFileDoubleClick: () => {},
  onPreviewFileClick: () => {},
  selectedFileUrl: null
};

export default FilesListViewer;
