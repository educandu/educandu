/* eslint-disable max-lines */
import by from 'thenby';
import React from 'react';
import debounce from 'debounce';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import Logger from '../common/logger.js';
import selection from '../ui/selection.js';
import Highlighter from 'react-highlighter';
import UsedStorage from './used-storage.js';
import DeleteButton from './delete-button.js';
import { useTranslation } from 'react-i18next';
import FileIcon from './icons/general/file-icon.js';
import mimeTypeHelper from '../ui/mime-type-helper.js';
import { handleApiError } from '../ui/error-helper.js';
import FolderIcon from './icons/general/folder-icon.js';
import UploadIcon from './icons/general/upload-icon.js';
import { useSetUser, useUser } from './user-context.js';
import { useStoragePlan } from './storage-plan-context.js';
import { useDateFormat, useLocale } from './locale-context.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { confirmCdnFileDelete } from './confirmation-dialogs.js';
import { LockOutlined, GlobalOutlined } from '@ant-design/icons';
import StorageApiClient from '../api-clients/storage-api-client.js';
import { processFilesBeforeUpload } from './storage-upload-helper.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { getPathSegments, getPrefix, isSubPath } from '../ui/path-helper.js';
import { filePickerStorageShape, userProps } from '../ui/default-prop-types.js';
import { Input, Table, Upload, Button, message, Breadcrumb, Select, Checkbox } from 'antd';

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
      currentUploadFiles: [],
      currentDropTarget: null,
      currentUploadMessage: null,
      currentPathSegments: currentLocation.initialPathSegments,
      locations,
      currentLocation,
      scaleDownImages: true
    };

    this.columns = [
      {
        title: () => this.props.t('displayNameText'),
        dataIndex: 'displayName',
        key: 'displayName',
        align: 'left',
        render: this.renderNameCell,
        sorter: by('isDirectory', { direction: -1 }).thenBy('displayName', { ignoreCase: true }),
        defaultSortOrder: 'ascend'
      },
      {
        title: () => this.props.t('categoryText'),
        dataIndex: 'categoryText',
        key: 'categoryText',
        align: 'left',
        width: 150,
        sorter: by('categoryText', { ignoreCase: true })
      },
      {
        title: () => this.props.t('sizeText'),
        dataIndex: 'sizeText',
        key: 'sizeText',
        align: 'right',
        width: 100,
        sorter: by('size')
      },
      {
        title: () => this.props.t('lastModifiedText'),
        dataIndex: 'lastModifiedText',
        key: 'lastModifiedText',
        align: 'right',
        width: 200,
        sorter: by('lastModified')
      }
    ];

    if (hasUserPermission(this.props.user, permissions.DELETE_STORAGE_FILE)) {
      this.columns.push({
        dataIndex: 'isDirectory',
        key: 'displayName',
        render: this.renderDeleteCell,
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

    this.uploadCurrentFilesDebounced = debounce(async ({ onProgress } = {}) => {
      const { storageApiClient, t } = this.props;
      const { currentPathSegments, currentUploadFiles, selectedRowKeys } = this.state;

      if (!currentUploadFiles.length) {
        return;
      }

      try {
        const prefix = getPrefix(currentPathSegments);
        const { usedBytes } = await storageApiClient.uploadFiles(currentUploadFiles, prefix, { onProgress });
        this.updateUsedBytes(usedBytes);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        this.clearCurrentUploadFiles();
      }

      await this.refreshFiles(currentPathSegments, selectedRowKeys);
    }, 100);
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

  addToCurrentUploadFiles(files) {
    const { t } = this.props;
    const { currentUploadFiles, currentUploadMessage } = this.state;
    const newUploadMessage = currentUploadMessage || { hide: message.loading(t('fileUpload'), 0) };

    this.setState({
      currentUploadFiles: [...currentUploadFiles, ...files],
      currentUploadMessage: newUploadMessage
    });
  }

  clearCurrentUploadFiles() {
    const { currentUploadMessage } = this.state;

    if (currentUploadMessage) {
      currentUploadMessage.hide();
    }

    this.setState({
      currentUploadFiles: [],
      currentUploadMessage: null
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

  handleFrameDrop(event) {
    if (!this.eventHasFiles(event)) {
      return;
    }

    this.resetDragging();

    const { currentDropTarget } = this.state;
    const files = event.dataTransfer && event.dataTransfer.files ? Array.from(event.dataTransfer.files) : null;
    if (!currentDropTarget || !files || !files.length) {
      return;
    }

    this.collectFilesToUpload(files);
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

  updateUsedBytes(usedBytes) {
    this.props.setUser({ ...this.props.user, ...{ storage: { ...this.props.user.storage, usedBytes } } });
  }

  async collectFilesToUpload(files, { onProgress } = {}) {
    const { t } = this.props;

    const processedFiles = await processFilesBeforeUpload({ files, scaleDownImages: this.state.scaleDownImages });

    if (this.state.currentLocation.isPrivate) {
      const requiredBytes = processedFiles.reduce((totalSize, file) => totalSize + file.size, 0);
      const availableBytes = Math.max(0, this.props.storagePlan?.maxBytes || 0 - this.props.user.storage.usedBytes);

      if (requiredBytes > availableBytes) {
        message.error(t('insufficientPrivateStorge'));
        return;
      }
    }

    this.addToCurrentUploadFiles(processedFiles);

    this.uploadCurrentFilesDebounced({ onProgress });
  }

  async handleDeleteFile(fileName) {
    const { storageApiClient, onSelectionChanged, t } = this.props;
    const { currentPathSegments, selectedRowKeys } = this.state;
    const prefix = getPrefix(currentPathSegments);
    const objectName = `${prefix}${fileName}`;

    try {
      const { usedBytes } = await storageApiClient.deleteCdnObject(prefix, fileName);
      this.updateUsedBytes(usedBytes);

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

  onCustomUpload({ file, onProgress, onSuccess }) {
    const result = this.collectFilesToUpload([file], { onProgress });
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

  renderDeleteCell(isDirectory) {
    return isDirectory ? null : <DeleteButton />;
  }

  renderNameCell(text, record) {
    const { filterText } = this.state;
    const normalizedFilterText = filterText.toLowerCase().trim();
    const icon = record.isDirectory
      ? <span className="StorageBrowser-browserRecordIcon StorageBrowser-browserRecordIcon--folder"><FolderIcon /></span>
      : <span className="StorageBrowser-browserRecordIcon StorageBrowser-browserRecordIcon--file"><FileIcon /></span>;

    return (
      <span className="StorageBrowser-browserRecordText">
        {icon}
        &nbsp;&nbsp;&nbsp;
        <Highlighter search={normalizedFilterText} matchClass="StorageBrowser-browserRecordText is-highlighted">{text}</Highlighter>
      </span>
    );
  }

  renderRecordsTable(records) {
    const { isRefreshing, currentUploadFiles } = this.state;

    return (
      <Table
        bordered={false}
        pagination={false}
        size="middle"
        columns={this.columns}
        dataSource={records}
        rowClassName={this.getRowClassName}
        loading={isRefreshing || currentUploadFiles.length !== 0}
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

  handleScaleDownImagesChange(event) {
    this.setState({ scaleDownImages: event.target.checked });
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

    const filterTextInputClassNames = classNames({
      'StorageBrowser-control StorageBrowser-control--filter': true,
      'is-active': !!normalizedFilterText
    });

    return (
      <div className="StorageBrowser">
        <div>
          {this.renderBreadCrumbs(currentPathSegments, currentLocation)}
        </div>
        <div className="StorageBrowser-storageUsage">
          {currentLocation.isPrivate && (
            <UsedStorage usedBytes={this.props.user.storage.usedBytes} maxBytes={this.props.storagePlan?.maxBytes || 0} showLabel />
          )}
        </div>

        <div className="StorageBrowser-controls">
          <Input
            allowClear
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
            className="StorageBrowser-control"
            >
            <Button disabled={!canUpload}>
              <UploadIcon />&nbsp;<span>{t('uploadFiles')}</span>
            </Button>
          </Upload>
          <Checkbox className="StorageBrowser-control" checked={this.state.scaleDownImages} onChange={this.handleScaleDownImagesChange}>
            {t('scaleDownImages')}
          </Checkbox>
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
  const setUser = useSetUser();
  const storagePlan = useStoragePlan();

  return (
    <StorageBrowser
      storageApiClient={storageApiClient}
      uiLanguage={uiLanguage}
      formatDate={formatDate}
      user={user}
      setUser={setUser}
      storagePlan={storagePlan}
      t={t}
      {...props}
      />
  );
}
