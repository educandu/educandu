/* eslint-disable max-lines */
import React from 'react';
import firstBy from 'thenby';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import Logger from '../common/logger.js';
import selection from '../ui/selection.js';
import Highlighter from 'react-highlighter';
import { useUser } from './user-context.js';
import UsedStorage from './used-storage.js';
import { useTranslation } from 'react-i18next';
import mimeTypeHelper from '../ui/mime-type-helper.js';
import { handleApiError } from '../ui/error-helper.js';
import { useStoragePlan } from './storage-plan-context.js';
import { useDateFormat, useLocale } from './locale-context.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { confirmCdnFileDelete } from './confirmation-dialogs.js';
import StorageApiClient from '../api-clients/storage-api-client.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { getPathSegments, getPrefix, isSubPath } from '../ui/path-helper.js';
import { filePickerStorageShape, userProps } from '../ui/default-prop-types.js';
import { Input, Table, Upload, Button, message, Breadcrumb, Select } from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  CloseOutlined,
  UploadOutlined,
  DeleteOutlined,
  LockOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const logger = new Logger(import.meta.url);

class StorageBrowser extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.lastDragElement = null;
    this.browserRef = React.createRef();
    this.filterTextInputRef = React.createRef();

    const locations = [
      {
        ...this.createPathSegments(props.publicStorage),
        isPrivate: false,
        key: 'public'
      }
    ];

    if (props.privateStorage) {
      locations.push({
        ...this.createPathSegments(props.privateStorage),
        isPrivate: true,
        key: 'private'
      });
    }

    const currentLocation = locations[0];

    this.state = {
      records: [],
      filterText: '',
      isRefreshing: false,
      selectedRowKeys: [],
      currentUploadCount: 0,
      currentDropTarget: null,
      currentUploadMessage: null,
      currentPathSegments: currentLocation.initialPathSegments,
      locations,
      currentLocation
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

    if (hasUserPermission(this.props.user, permissions.DELETE_STORAGE_FILE)) {
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
    if (this.props.uiLanguage !== prevProps.uiLanguage) {
      const { currentPathSegments, selectedRowKeys } = this.state;
      this.refreshFiles(currentPathSegments, selectedRowKeys);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('dragover', this.handleWindowDragOverOrDrop);
    window.removeEventListener('drop', this.handleWindowDragOverOrDrop);
  }

  createPathSegments(storage) {
    const rootPathSegments = getPathSegments(storage.rootPath);
    const uploadPathSegments = storage.uploadPath ? getPathSegments(storage.uploadPath) : rootPathSegments;
    const initialPathSegments = storage.initialPath ? getPathSegments(storage.initialPath) : rootPathSegments;

    if (!isSubPath({ pathSegments: rootPathSegments, subPathSegments: uploadPathSegments })) {
      throw new Error(`${storage.uploadPath} is not a subpath of root ${storage.rootPath}`);
    }

    if (!isSubPath({ pathSegments: rootPathSegments, subPathSegments: initialPathSegments })) {
      throw new Error(`${storage.initialPath} is not a subpath of root ${storage.rootPath}`);
    }

    return { rootPathSegments, uploadPathSegments, initialPathSegments };
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

    const { currentDropTarget } = this.state;
    const files = event.dataTransfer && event.dataTransfer.files ? Array.from(event.dataTransfer.files) : null;
    if (!currentDropTarget || !files || !files.length) {
      return;
    }

    await this.uploadFiles(files);
  }

  async refreshFiles(pathSegments, keysToSelect) {
    this.setState({ isRefreshing: true });

    const { storageApiClient, t } = this.props;
    const { initialPathSegments, uploadPathSegments } = this.state.currentLocation;
    const prefix = getPrefix(pathSegments);

    let objects;
    try {
      const result = await storageApiClient.getObjects(prefix);
      objects = result.objects;
    } catch (error) {
      handleApiError({ error, logger, t });
      objects = [];
    }

    const recordsFromCdn = this.convertObjectsToRecords(objects);
    const recordsWithVirtualPaths = this.ensureVirtualFolders(pathSegments, recordsFromCdn, [initialPathSegments, uploadPathSegments]);
    const selectedRowKeys = selection.removeInvalidKeys(keysToSelect, recordsWithVirtualPaths.map(r => r.key));

    this.setState({
      records: recordsWithVirtualPaths,
      selectedRowKeys,
      currentPathSegments: pathSegments,
      isRefreshing: false
    });
  }

  async uploadFiles(files, { onProgress } = {}) {
    this.increaseCurrentUploadCount();

    const { storageApiClient, t } = this.props;
    const { currentPathSegments, selectedRowKeys } = this.state;
    const prefix = getPrefix(currentPathSegments);

    try {
      await storageApiClient.uploadFiles(files, prefix, { onProgress });
    } catch (error) {
      handleApiError({ error, logger, t });
    }

    this.decreaseCurrentUploadCount();

    await this.refreshFiles(currentPathSegments, selectedRowKeys);
  }

  async handleDeleteFile(fileName) {
    const { storageApiClient, onSelectionChanged, t } = this.props;
    const { currentPathSegments, selectedRowKeys } = this.state;
    const prefix = getPrefix(currentPathSegments);
    const objectName = `${prefix}${fileName}`;

    try {
      await storageApiClient.deleteCdnObject(prefix, fileName);
      if (selectedRowKeys.includes(objectName)) {
        onSelectionChanged([], true);
      }
    } catch (error) {
      handleApiError({ error, logger, t });
    }

    await this.refreshFiles(currentPathSegments, selectedRowKeys.filter(key => key !== objectName));
  }

  ensureVirtualFolders(currentPathSegments, existingRecords, virtualFolderPathSegments) {
    let result = existingRecords.slice();
    for (const segments of virtualFolderPathSegments) {
      if (segments.length > currentPathSegments.length
        && isSubPath({ pathSegments: currentPathSegments, subPathSegments: segments })
      ) {
        const assumedDirectoryPath = getPrefix(segments.slice(0, currentPathSegments.length + 1));
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
      const segments = getPathSegments(path);
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
    return this.refreshFiles(getPathSegments(record.path), selectedRowKeys);
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
    const result = await this.uploadFiles([file], { onProgress });
    onSuccess(result);
  }

  getRowClassName(record) {
    const { selectedRowKeys, currentDropTarget } = this.state;
    return classNames({
      'StorageBrowser-tableRow': true,
      'StorageBrowser-tableRow--selected': selectedRowKeys.includes(record.key),
      'StorageBrowser-tableRow--dropTarget': record.path === currentDropTarget
    });
  }

  renderDeleteColumn(isDirectory) {
    return isDirectory ? null : (<DeleteOutlined className="StorageBrowser-tableDeleteCell" />);
  }

  renderNameColumn(text, record) {
    const { filterText } = this.state;
    const normalizedFilterText = filterText.toLowerCase().trim();
    const icon = record.isDirectory
      ? <span className="StorageBrowser-browserRecordIcon StorageBrowser-browserRecordIcon--folder"><FolderOutlined /></span>
      : <span className="StorageBrowser-browserRecordIcon StorageBrowser-browserRecordIcon--file"><FileOutlined /></span>;

    return (
      <span className="StorageBrowser-browserRecordText">
        {icon}
        &nbsp;&nbsp;&nbsp;
        <Highlighter search={normalizedFilterText} matchClass="StorageBrowser-browserRecordText is-highlighted">{text}</Highlighter>
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

  createBreadcrumbItemData({ pathSegments, isEnabled }) {
    const data = {
      key: getPrefix(pathSegments),
      text: pathSegments[pathSegments.length - 1] || '',
      segments: pathSegments,
      isEnabled
    };

    if (isEnabled) {
      data.onClick = () => this.handleBreadCrumbClick(data);
    }

    return data;
  }

  renderBreadCrumbItem({ key, text, isEnabled, onClick }) {
    return (
      <Breadcrumb.Item key={key}>
        {isEnabled ? (<a onClick={onClick}>{text}</a>) : text}
      </Breadcrumb.Item>
    );
  }

  renderBreadCrumbs(currentPathSegments, currentLocation) {
    const { t } = this.props;
    const lockedPathSegmentsCount = currentLocation.rootPathSegments.length;

    const rootOptions = this.state.locations.map(location => ({
      label: t(location.isPrivate ? 'privateStorage' : 'publicStorage'),
      icon: location.isPrivate ? <LockOutlined /> : <GlobalOutlined />,
      value: location.key
    }));

    let rootBreadCrumb;
    if (rootOptions.length > 1) {
      rootBreadCrumb = (
        <Breadcrumb.Item key="root">
          <Select
            value={currentLocation.key}
            onChange={this.handleLocationChange}
            bordered={false}
            size="small"
            >
            {rootOptions.map(opt => (
              <Select.Option key={opt.value} label={opt.label} value={opt.value}>
                {opt.icon}&nbsp;&nbsp;{opt.label}
              </Select.Option>
            ))}
          </Select>
        </Breadcrumb.Item>
      );
    } else {
      rootBreadCrumb = (
        <Breadcrumb.Item key="root">
          {rootOptions[0].icon}&nbsp;&nbsp;{rootOptions[0].label}
        </Breadcrumb.Item>
      );
    }

    const items = currentPathSegments.reduce((list, segment) => {
      const prevItemSegments = list[list.length - 1]?.segments || [];
      const thisItemSegments = [...prevItemSegments, segment];
      const newItemData = this.createBreadcrumbItemData({
        pathSegments: thisItemSegments,
        isEnabled: thisItemSegments.length >= lockedPathSegmentsCount
      });
      return [...list, newItemData];
    }, []);

    return (
      <Breadcrumb>
        {rootBreadCrumb}
        {items.map(this.renderBreadCrumbItem)}
      </Breadcrumb>
    );
  }

  handleLocationChange(newLocationKey) {
    const { locations, selectedRowKeys } = this.state;
    const { onSelectionChanged } = this.props;

    const newLocation = locations.find(location => location.key === newLocationKey);
    this.setState({
      selectedRowKeys: [],
      currentLocation: newLocation,
      currentPathSegments: newLocation.initialPathSegments
    });

    onSelectionChanged([]);
    this.refreshFiles(newLocation.initialPathSegments, selectedRowKeys);
  }

  render() {
    const { t } = this.props;
    const { records, currentPathSegments, currentLocation, currentDropTarget, filterText } = this.state;
    const { uploadPathSegments } = currentLocation;

    const normalizedFilterText = filterText.toLowerCase().trim();
    const filteredRecords = records.filter(r => r.displayName && r.displayName.toLowerCase().includes(normalizedFilterText));

    const currentPrefix = getPrefix(currentPathSegments);
    const canUpload = isSubPath({ pathSegments: uploadPathSegments, subPathSegments: currentPathSegments });

    const browserClassNames = classNames({
      'StorageBrowser-browser': true,
      'StorageBrowser-browser--dropTarget': canUpload && currentDropTarget === currentPrefix
    });

    const suffix = normalizedFilterText ? <CloseOutlined className="StorageBrowser-filterClearButton" onClick={this.handleFilterTextClear} /> : null;
    const filterTextInputClassNames = classNames({
      'StorageBrowser-filterInput': true,
      'is-active': !!normalizedFilterText
    });

    return (
      <div className="StorageBrowser">
        <div className="StorageBrowser-header">
          <div className="StorageBrowser-headerBreadCrumbs">
            {this.renderBreadCrumbs(currentPathSegments, currentLocation)}
          </div>
          <div className="StorageBrowser-headerButtons">
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
        <div className="StorageBrowser-storageUsage">
          {currentLocation.isPrivate && (
            <UsedStorage usedBytes={this.props.user.storage.usedBytes} maxBytes={this.props.storagePlan.maxBytes} showLabel />
          )}
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

StorageBrowser.propTypes = {
  ...userProps,
  formatDate: PropTypes.func.isRequired,
  onSelectionChanged: PropTypes.func,
  privateStorage: filePickerStorageShape,
  publicStorage: filePickerStorageShape.isRequired,
  selectionMode: PropTypes.oneOf([selection.NONE, selection.SINGLE, selection.MULTIPLE]),
  storageApiClient: PropTypes.instanceOf(StorageApiClient).isRequired,
  t: PropTypes.func.isRequired,
  uiLanguage: PropTypes.string.isRequired
};

StorageBrowser.defaultProps = {
  onSelectionChanged: () => {},
  privateStorage: null,
  selectionMode: selection.NONE
};

export default function StorageBrowserWrapper({ ...props }) {
  const { t } = useTranslation('storageBrowser');
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const { uiLanguage } = useLocale();
  const { formatDate } = useDateFormat();
  const user = useUser();
  const storagePlan = useStoragePlan();

  return (
    <StorageBrowser
      storageApiClient={storageApiClient}
      uiLanguage={uiLanguage}
      formatDate={formatDate}
      user={user}
      storagePlan={storagePlan}
      t={t}
      {...props}
      />
  );
}
