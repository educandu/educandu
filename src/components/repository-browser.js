/* eslint-disable max-lines */
import React from 'react';
import firstBy from 'thenby';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import selection from '../ui/selection.js';
import Highlighter from 'react-highlighter';
import { withUser } from './user-context.js';
import pathHelper from '../ui/path-helper.js';
import { inject } from './container-context.js';
import { withTranslation } from 'react-i18next';
import { withLanguage } from './language-context.js';
import mimeTypeHelper from '../ui/mime-type-helper.js';
import CdnApiClient from '../api-clients/cdn-api-client.js';
import { confirmCdnFileDelete } from './confirmation-dialogs.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { Input, Table, Upload, Button, message, Breadcrumb } from 'antd';
import { translationProps, languageProps, userProps } from '../ui/default-prop-types.js';
import { default as iconsNs, FolderOutlined, FileOutlined, CloseOutlined, UploadOutlined, HomeOutlined, DeleteOutlined } from '@ant-design/icons';

const Icon = iconsNs.default || iconsNs;

class RepositoryBrowser extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.lastDragElement = null;
    this.browserRef = React.createRef();
    this.filterTextInputRef = React.createRef();

    const rootPathSegments = pathHelper.getPathSegments(props.rootPrefix);
    const uploadPathSegments = props.uploadPrefix ? pathHelper.getPathSegments(props.uploadPrefix) : rootPathSegments;
    const initialPathSegments = props.initialPrefix ? pathHelper.getPathSegments(props.initialPrefix) : rootPathSegments;

    if (!pathHelper.isInPath(uploadPathSegments, rootPathSegments)) {
      throw new Error(`${props.uploadPrefix} is not a subpath of root ${props.rootPrefix}`);
    }

    if (!pathHelper.isInPath(initialPathSegments, rootPathSegments)) {
      throw new Error(`${props.initialPrefix} is not a subpath of root ${props.rootPrefix}`);
    }

    this.state = {
      records: [],
      filterText: '',
      isRefreshing: false,
      selectedRowKeys: [],
      currentUploadCount: 0,
      currentDropTarget: null,
      currentUploadMessage: null,
      currentPathSegments: initialPathSegments,
      lockedPathSegmentsCount: rootPathSegments.length,
      initialPathSegments,
      uploadPathSegments
    };

    this.columns = [
      {
        title: () => this.props.t('displayNameText'),
        dataIndex: 'displayName',
        key: 'displayName',
        align: 'left',
        render: this.renderNameColumn,
        sorter: firstBy('isDirectory', { direction: -1 })
          .thenBy('displayName', { ignoreCase: true })
          .thenBy('displayName', { ignoreCase: false }),
        defaultSortOrder: 'ascend'
      },
      {
        title: () => this.props.t('categoryText'),
        dataIndex: 'categoryText',
        key: 'categoryText',
        align: 'left',
        width: 150,
        sorter: firstBy('categoryText', { ignoreCase: false })
      },
      {
        title: () => this.props.t('sizeText'),
        dataIndex: 'sizeText',
        key: 'sizeText',
        align: 'right',
        width: 100,
        sorter: firstBy('size')
      },
      {
        title: () => this.props.t('lastModifiedText'),
        dataIndex: 'lastModifiedText',
        key: 'lastModifiedText',
        align: 'right',
        width: 200,
        sorter: firstBy('lastModified')
      }
    ];

    if (hasUserPermission(this.props.user, permissions.DELETE_CDN_FILE)) {
      this.columns.push({
        dataIndex: 'isDirectory',
        key: 'displayName',
        render: this.renderDeleteColumn,
        onCell: ({ displayName }) => {
          return {
            onClick: event => {
              this.handleDeleteClick(displayName);
              event.stopPropagation();
            }
          };
        }
      });
    }
  }

  componentDidMount() {
    this.resetDragging();
    window.addEventListener('dragover', this.handleWindowDragOverOrDrop);
    window.addEventListener('drop', this.handleWindowDragOverOrDrop);
    const { currentPathSegments, selectedRowKeys } = this.state;
    this.refreshFiles(currentPathSegments, selectedRowKeys);
  }

  componentDidUpdate(prevProps) {
    if (this.props.language !== prevProps.language) {
      const { currentPathSegments, selectedRowKeys } = this.state;
      this.refreshFiles(currentPathSegments, selectedRowKeys);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('dragover', this.handleWindowDragOverOrDrop);
    window.removeEventListener('drop', this.handleWindowDragOverOrDrop);
  }

  increaseCurrentUploadCount() {
    const { t } = this.props;
    const { currentUploadCount, currentUploadMessage } = this.state;
    const newUploadCount = currentUploadCount + 1;
    let newUploadMessage;

    if (currentUploadMessage) {
      newUploadMessage = currentUploadMessage;
    } else {
      const hide = message.loading(t('fileUpload'), 0);
      newUploadMessage = { hide };
    }

    this.setState({
      currentUploadCount: newUploadCount,
      currentUploadMessage: newUploadMessage
    });
  }

  decreaseCurrentUploadCount() {
    const { currentUploadCount, currentUploadMessage } = this.state;
    const newUploadCount = currentUploadCount - 1;
    let newUploadMessage;

    if (newUploadCount === 0) {
      newUploadMessage = null;
      if (currentUploadMessage) {
        currentUploadMessage.hide();
      }
    } else {
      newUploadMessage = currentUploadMessage;
    }

    this.setState({
      currentUploadCount: newUploadCount,
      currentUploadMessage: newUploadMessage
    });
  }

  eventHasFiles(event) {
    // In most browsers this is an array, but in IE11 it's an Object :(
    let hasFiles = false;
    const { types } = event.dataTransfer;
    for (const keyOrIndex in types) {
      if (types[keyOrIndex] === 'Files') {
        hasFiles = true;
        break;
      }
    }
    return hasFiles;
  }

  getDropTarget(event) {
    let dropTarget;
    let elem = event.target;

    while (elem && !(dropTarget = elem.getAttribute('data-drop-target'))) {
      elem = elem.parentNode;
    }

    return dropTarget || null;
  }

  resetDragging() {
    this.lastDragElement = null;
    this.setState({ currentDropTarget: null });
  }

  handleWindowDragOverOrDrop(event) {
    // This prevents the browser from trying to load whatever file the user dropped on the window
    event.preventDefault();
  }

  handleFrameDrag(event) {
    if (!this.eventHasFiles(event) || event.target === this.lastDragElement) {
      return;
    }

    this.lastDragElement = event.target;
    const dropTarget = this.getDropTarget(event);

    this.setState({ currentDropTarget: dropTarget });
  }

  handleFrameLeave(event) {
    if (!this.eventHasFiles(event)) {
      return;
    }

    this.lastDragElement = null;
    this.setState({ currentDropTarget: null });
  }

  async handleFrameDrop(event) {
    if (!this.eventHasFiles(event)) {
      return;
    }

    this.resetDragging();

    const { currentDropTarget, currentPathSegments } = this.state;
    const files = event.dataTransfer && event.dataTransfer.files ? Array.from(event.dataTransfer.files) : null;
    if (!currentDropTarget || !files || !files.length) {
      return;
    }

    const pathSegments = currentDropTarget === '*'
      ? currentPathSegments
      : pathHelper.getPathSegments(currentDropTarget);

    await this.uploadFiles(pathSegments, files);
  }

  async refreshFiles(pathSegments, keysToSelect) {
    this.setState({ isRefreshing: true });

    const { cdnApiClient } = this.props;
    const { initialPathSegments, uploadPathSegments } = this.state;
    const prefix = pathHelper.getPrefix(pathSegments);
    const result = await cdnApiClient.getObjects(prefix);
    const recordsFromCdn = this.convertObjectsToRecords(result.objects);
    const recordsWithVirtualPaths = this.ensureVirtualFolders(pathSegments, recordsFromCdn, [initialPathSegments, uploadPathSegments]);
    const selectedRowKeys = selection.removeInvalidKeys(keysToSelect, recordsWithVirtualPaths.map(r => r.key));

    this.setState({
      records: recordsWithVirtualPaths,
      selectedRowKeys,
      currentPathSegments: pathSegments,
      isRefreshing: false
    });
  }

  async uploadFiles(pathSegments, files, { onProgress } = {}) {
    this.increaseCurrentUploadCount();

    const { cdnApiClient } = this.props;
    const { currentPathSegments, selectedRowKeys } = this.state;
    const prefix = pathHelper.getPrefix(currentPathSegments);

    await cdnApiClient.uploadFiles(files, prefix, { onProgress });

    this.decreaseCurrentUploadCount();

    await this.refreshFiles(currentPathSegments, selectedRowKeys);
  }

  async handleDeleteFile(fileName) {
    const { cdnApiClient, onSelectionChanged } = this.props;
    const { currentPathSegments, selectedRowKeys } = this.state;
    const prefix = pathHelper.getPrefix(currentPathSegments);
    const objectName = `${prefix}${fileName}`;

    await cdnApiClient.deleteCdnObject(prefix, fileName);
    if (selectedRowKeys.includes(objectName)) {
      onSelectionChanged([], true);
    }

    await this.refreshFiles(currentPathSegments, selectedRowKeys.filter(key => key !== objectName));
  }

  ensureVirtualFolders(currentPathSegments, existingRecords, virtualFolderPathSegments) {
    let result = existingRecords.slice();
    for (const segments of virtualFolderPathSegments) {
      if (segments.length > currentPathSegments.length && pathHelper.isInPath(segments, currentPathSegments)) {
        const assumedDirectoryPath = pathHelper.getPrefix(segments.slice(0, currentPathSegments.length + 1));
        if (!result.find(rec => rec.isDirectory && rec.path === assumedDirectoryPath)) {
          result = result.concat(this.convertObjectsToRecords([{ prefix: assumedDirectoryPath, isVirtual: true }]));
        }
      }
    }
    return result;
  }

  convertObjectsToRecords(objects) {
    const { t, locale, formatDate } = this.props;
    return objects.map(obj => {
      const path = `${obj.prefix || ''}${obj.name || ''}`;
      const segments = pathHelper.getPathSegments(path);
      const isDirectory = !obj.name;
      const category = isDirectory ? mimeTypeHelper.CATEGORY_FOLDER : mimeTypeHelper.getCategory(obj.name);
      const record = {
        key: path,
        path,
        size: obj.size,
        sizeText: Number.isFinite(obj.size) && !isDirectory ? prettyBytes(obj.size, { locale }) : '---',
        lastModified: obj.lastModified,
        lastModifiedText: obj.lastModified && !isDirectory ? formatDate(obj.lastModified, 'PPp') : '---',
        displayName: segments[segments.length - 1] || '',
        isDirectory,
        category,
        categoryText: mimeTypeHelper.localizeCategory(category, t),
        originalObject: obj,
        segments,
        rowProps: {}
      };

      record.rowProps.onClick = () => this.handleRecordClick(record);

      if (!record.isDirectory) {
        record.rowProps.onDoubleClick = () => this.handleFileDoubleClick(record);
      }

      if (record.isDirectory) {
        record.rowProps['data-drop-target'] = path;
      }

      return record;
    });
  }

  handleBreadCrumbClick(breadCrumb) {
    const { selectedRowKeys } = this.state;
    const { onSelectionChanged } = this.props;
    this.setState({ selectedRowKeys: [] });
    onSelectionChanged([]);
    this.refreshFiles(breadCrumb.segments, selectedRowKeys);
  }

  handleRecordClick(record) {
    return record.isDirectory ? this.handleDirectoryClick(record) : this.handleFileClick(record, false);
  }

  handleDirectoryClick(record) {
    const { selectedRowKeys } = this.state;
    const { onSelectionChanged } = this.props;
    this.setState({ selectedRowKeys: [] });
    onSelectionChanged([]);
    return this.refreshFiles(pathHelper.getPathSegments(record.path), selectedRowKeys);
  }

  handleDeleteClick(fileName) {
    const { t } = this.props;
    confirmCdnFileDelete(t, fileName, () => this.handleDeleteFile(fileName));
  }

  handleFileClick(record, applySelection) {
    const { selectedRowKeys, records } = this.state;
    const { selectionMode, onSelectionChanged } = this.props;

    let newSelectedRowKeys;
    if (selectedRowKeys.includes(record.key)) {
      newSelectedRowKeys = applySelection ? selectedRowKeys : selection.removeKeyFromSelection(selectedRowKeys, record.key, selectionMode);
    } else {
      newSelectedRowKeys = selection.addKeyToSelection(selectedRowKeys, record.key, selectionMode);
    }

    this.setState({ selectedRowKeys: newSelectedRowKeys });

    onSelectionChanged(newSelectedRowKeys.map(key => records.find(r => r.key === key).originalObject), applySelection);
  }

  handleFileDoubleClick(record) {
    this.handleFileClick(record, true);
  }

  handleRow(record) {
    return record.rowProps;
  }

  handleFilterTextChange(event) {
    this.setState({ filterText: event.target.value });
  }

  handleFilterTextClear() {
    this.filterTextInputRef.current.focus();
    this.setState({ filterText: '' });
  }

  async onCustomUpload({ file, onProgress, onSuccess }) {
    const { currentPathSegments } = this.state;
    const result = await this.uploadFiles(currentPathSegments, [file], { onProgress });
    onSuccess(result);
  }

  getRowClassName(record) {
    const { selectedRowKeys, currentDropTarget } = this.state;
    return classNames({
      'RepositoryBrowser-tableRow': true,
      'RepositoryBrowser-tableRow--selected': selectedRowKeys.includes(record.key),
      'RepositoryBrowser-tableRow--dropTarget': record.path === currentDropTarget
    });
  }

  renderDeleteColumn(isDirectory) {
    return isDirectory ? null : (<DeleteOutlined className="RepositoryBrowser-tableDeleteCell" />);
  }

  renderNameColumn(text, record) {
    const { filterText } = this.state;
    const normalizedFilterText = filterText.toLowerCase().trim();
    const icon = record.isDirectory
      ? <span className="RepositoryBrowser-browserRecordIcon RepositoryBrowser-browserRecordIcon--folder"><FolderOutlined /></span>
      : <span className="RepositoryBrowser-browserRecordIcon RepositoryBrowser-browserRecordIcon--file"><FileOutlined /></span>;

    return (
      <span className="RepositoryBrowser-browserRecordText">
        {icon}
        &nbsp;&nbsp;&nbsp;
        <Highlighter search={normalizedFilterText} matchClass="RepositoryBrowser-browserRecordText is-highlighted">{text}</Highlighter>
      </span>
    );
  }

  renderRecordsTable(records) {
    const { isRefreshing, currentUploadCount } = this.state;

    return (
      <Table
        bordered={false}
        pagination={false}
        size="middle"
        columns={this.columns}
        dataSource={records}
        rowClassName={this.getRowClassName}
        loading={isRefreshing || currentUploadCount !== 0}
        onRow={this.handleRow}
        />
    );
  }

  createBreadcrumbItemData({ pathSegments, lockedPathSegmentsCount, icon }) {
    const isEnabled = pathSegments.length >= lockedPathSegmentsCount;

    const data = {
      key: pathHelper.getPrefix(pathSegments),
      text: pathSegments[pathSegments.length - 1] || '',
      segments: pathSegments,
      isEnabled,
      icon
    };

    if (isEnabled) {
      data.onClick = () => this.handleBreadCrumbClick(data);
    }

    return data;
  }

  renderBreadCrumbItem({ key, text, isEnabled, icon, onClick }) {
    const content = (
      <span>
        {icon && <Icon component={icon} />}
        {icon && text && ' '}
        {text}
      </span>
    );

    return (
      <Breadcrumb.Item key={key}>
        {isEnabled ? (<a onClick={onClick}>{content}</a>) : content}
      </Breadcrumb.Item>
    );
  }

  renderBreadCrumbs(pathSegments, lockedPathSegmentsCount) {
    const rootSegment = this.createBreadcrumbItemData({
      pathSegments: [],
      lockedPathSegmentsCount,
      icon: HomeOutlined
    });

    const items = pathSegments.reduce((list, segment) => {
      const prevItemSegments = list[list.length - 1].segments;
      const newItemData = this.createBreadcrumbItemData({
        pathSegments: [...prevItemSegments, segment],
        lockedPathSegmentsCount
      });
      return [...list, newItemData];
    }, [rootSegment]);

    return (
      <Breadcrumb>
        {items.map(this.renderBreadCrumbItem)}
      </Breadcrumb>
    );
  }

  render() {
    const { t } = this.props;
    const { records, currentPathSegments, uploadPathSegments, lockedPathSegmentsCount, currentDropTarget, filterText } = this.state;

    const normalizedFilterText = filterText.toLowerCase().trim();
    const filteredRecords = records.filter(r => r.displayName && r.displayName.toLowerCase().includes(normalizedFilterText));

    const currentPrefix = pathHelper.getPrefix(currentPathSegments);
    const canUpload = pathHelper.isInPath(currentPathSegments, uploadPathSegments);

    const browserClassNames = classNames({
      'RepositoryBrowser-browser': true,
      'RepositoryBrowser-browser--dropTarget': canUpload && currentDropTarget === currentPrefix
    });

    const suffix = normalizedFilterText ? <CloseOutlined className="RepositoryBrowser-filterClearButton" onClick={this.handleFilterTextClear} /> : null;
    const filterTextInputClassNames = classNames({
      'RepositoryBrowser-filterInput': true,
      'is-active': !!normalizedFilterText
    });

    return (
      <div className="RepositoryBrowser">
        <div className="RepositoryBrowser-header">
          <div className="RepositoryBrowser-headerBreadCrumbs">
            {this.renderBreadCrumbs(currentPathSegments, lockedPathSegmentsCount)}
          </div>
          <div className="RepositoryBrowser-headerButtons">
            <Input
              suffix={suffix}
              value={filterText}
              placeholder={t('searchFilter')}
              ref={this.filterTextInputRef}
              onChange={this.handleFilterTextChange}
              className={filterTextInputClassNames}
              />
            <Upload
              multiple
              disabled={!canUpload}
              showUploadList={false}
              customRequest={this.onCustomUpload}
              >
              <Button disabled={!canUpload}>
                <UploadOutlined />&nbsp;<span>{t('uploadFiles')}</span>
              </Button>
            </Upload>
          </div>
        </div>
        <div
          ref={this.browserRef}
          className={browserClassNames}
          onDragOver={canUpload ? this.handleFrameDrag : null}
          onDragLeave={canUpload ? this.handleFrameLeave : null}
          onDrop={canUpload ? this.handleFrameDrop : null}
          data-drop-target={canUpload ? currentPrefix : null}
          >
          {this.renderRecordsTable(filteredRecords)}
        </div>
      </div>
    );
  }
}

RepositoryBrowser.propTypes = {
  ...userProps,
  ...languageProps,
  ...translationProps,
  cdnApiClient: PropTypes.instanceOf(CdnApiClient).isRequired,
  initialPrefix: PropTypes.string,
  onSelectionChanged: PropTypes.func,
  rootPrefix: PropTypes.string.isRequired,
  selectionMode: PropTypes.oneOf([selection.NONE, selection.SINGLE, selection.MULTIPLE]),
  uploadPrefix: PropTypes.string
};

RepositoryBrowser.defaultProps = {
  initialPrefix: null,
  onSelectionChanged: () => {},
  selectionMode: selection.NONE,
  uploadPrefix: null
};

export default withTranslation('repositoryBrowser')(withLanguage(withUser(inject({
  cdnApiClient: CdnApiClient
}, RepositoryBrowser))));
