const React = require('react');
const moment = require('moment');
const firstBy = require('thenby');
const autoBind = require('auto-bind');
const Icon = require('antd/lib/icon');
const Table = require('antd/lib/table');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const Upload = require('antd/lib/upload');
const Button = require('antd/lib/button');
const Divider = require('antd/lib/divider');
const message = require('antd/lib/message');
const prettyBytes = require('pretty-bytes');
const selection = require('../ui/selection');
const pathHelper = require('../ui/path-helper');
const Breadcrumb = require('antd/lib/breadcrumb');
const browserHelper = require('../ui/browser-helper');
const { inject } = require('./container-context.jsx');
const mimeTypeHelper = require('../ui/mime-type-helper');
const CdnApiClient = require('../services/cdn-api-client');

const BROWSER_LOCALE = 'de';

const mappingsDe = {
  [mimeTypeHelper.CATEGORY_TEXT]: 'Text',
  [mimeTypeHelper.CATEGORY_MARKUP]: 'Markup',
  [mimeTypeHelper.CATEGORY_IMAGE]: 'Bild',
  [mimeTypeHelper.CATEGORY_VIDEO]: 'Video',
  [mimeTypeHelper.CATEGORY_AUDIO]: 'Audio',
  [mimeTypeHelper.CATEGORY_ARCHIVE]: 'Archiv',
  [mimeTypeHelper.CATEGORY_DOCUMENT]: 'Dokument',
  [mimeTypeHelper.CATEGORY_SPREADSHEET]: 'Tabellenkalkulation',
  [mimeTypeHelper.CATEGORY_PRESENTATION]: 'Präsentation',
  [mimeTypeHelper.CATEGORY_PROGRAM]: 'Programm',
  [mimeTypeHelper.CATEGORY_FOLDER]: 'Verzeichnis',
  [mimeTypeHelper.CATEGORY_UNKNOWN]: 'Unbekannt'
};

function localizeCategory(cat) {
  return mappingsDe[cat];
}

class RepositoryBrowser extends React.Component {
  constructor(props) {
    super(props);

    autoBind.react(this);

    this.lastDragElement = null;
    this.browserRef = React.createRef();

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
      isRefreshing: false,
      selectedRowKeys: [],
      currentUploadCount: 0,
      currentDropTarget: null,
      currentUploadMessage: null,
      currentPathSegments: initialPathSegments,
      lockedPathSegmentsCount: rootPathSegments.length,
      initialPathSegments: initialPathSegments,
      uploadPathSegments: uploadPathSegments
    };

    this.columns = [
      {
        title: 'Name',
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
        title: 'Typ',
        dataIndex: 'categoryText',
        key: 'categoryText',
        align: 'left',
        width: 150,
        sorter: firstBy('categoryText', { ignoreCase: false })
      },
      {
        title: 'Größe',
        dataIndex: 'sizeText',
        key: 'sizeText',
        align: 'right',
        width: 100,
        sorter: firstBy('size')
      },
      {
        title: 'Datum',
        dataIndex: 'lastModifiedText',
        key: 'lastModifiedText',
        align: 'right',
        width: 200,
        sorter: firstBy('lastModified')
      }
    ];
  }

  componentDidMount() {
    this.resetDragging();
    window.addEventListener('dragover', this.handleWindowDragOverOrDrop);
    window.addEventListener('drop', this.handleWindowDragOverOrDrop);
    const { currentPathSegments, selectedRowKeys } = this.state;
    return this.refreshFiles(currentPathSegments, selectedRowKeys);
  }

  componentWillUnmount() {
    window.removeEventListener('dragover', this.handleWindowDragOverOrDrop);
    window.removeEventListener('drop', this.handleWindowDragOverOrDrop);
  }

  increaseCurrentUploadCount() {
    const { currentUploadCount, currentUploadMessage } = this.state;

    const newUploadCount = currentUploadCount + 1;
    let newUploadMessage;
    if (currentUploadMessage) {
      newUploadMessage = currentUploadMessage;
    } else {
      const hide = message.loading('Datei-Upload', 0);
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
    if (!this.eventHasFiles(event)) {
      return;
    }

    if (event.target === this.lastDragElement) {
      return;
    }

    if (!browserHelper.isIE()) {
      event.dataTransfer.dropEffect = 'copy';
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
      selectedRowKeys: selectedRowKeys,
      currentPathSegments: pathSegments,
      isRefreshing: false
    });
  }

  async uploadFiles(pathSegments, files, { onProgress } = {}) {
    this.increaseCurrentUploadCount();

    const { cdnApiClient } = this.props;
    const prefix = pathHelper.getPrefix(pathSegments);

    await cdnApiClient.uploadFiles(files, prefix, { onProgress });

    this.decreaseCurrentUploadCount();

    const { currentPathSegments, selectedRowKeys } = this.state;
    await this.refreshFiles(currentPathSegments, selectedRowKeys);
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
    return objects.map(obj => {
      const path = `${obj.prefix || ''}${obj.name || ''}`;
      const segments = pathHelper.getPathSegments(path);
      const isDirectory = !obj.name;
      const category = isDirectory ? mimeTypeHelper.CATEGORY_FOLDER : mimeTypeHelper.getCategory(obj.name);
      const record = {
        key: path,
        path: path,
        size: obj.size,
        sizeText: Number.isFinite(obj.size) && !isDirectory ? prettyBytes(obj.size, { locale: BROWSER_LOCALE }) : '---',
        lastModified: obj.lastModified,
        lastModifiedText: obj.lastModified && !isDirectory ? moment(obj.lastModified).locale(BROWSER_LOCALE).format('lll') : '---',
        displayName: segments[segments.length - 1] || '',
        isDirectory: isDirectory,
        category: category,
        categoryText: localizeCategory(category),
        originalObject: obj,
        segments: segments,
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

  renderNameColumn(text, record) {
    const icon = record.isDirectory
      ? <span className="RepositoryBrowser-browserRecordIcon RepositoryBrowser-browserRecordIcon--folder"><Icon type="folder" /></span>
      : <span className="RepositoryBrowser-browserRecordIcon RepositoryBrowser-browserRecordIcon--file"><Icon type="file" /></span>;

    return <span>{icon}&nbsp;&nbsp;&nbsp;{text}</span>;
  }

  renderActionsColumn() {
    return (
      <span>
        <a>Aktion</a>
        <Divider type="vertical" />
        <a className="ant-dropdown-link">
          Weitere Aktionen <Icon type="down" />
        </a>
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
      isEnabled: isEnabled,
      icon: icon
    };

    if (isEnabled) {
      data.onClick = () => this.handleBreadCrumbClick(data);
    }

    return data;
  }

  renderBreadCrumbItem({ key, text, isEnabled, icon, onClick }) {
    const content = (
      <span>
        {icon && <Icon type={icon} />}
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
      lockedPathSegmentsCount: lockedPathSegmentsCount,
      icon: 'home'
    });

    const items = pathSegments.reduce((list, segment) => {
      const prevItemSegments = list[list.length - 1].segments;
      const newItemData = this.createBreadcrumbItemData({
        pathSegments: [...prevItemSegments, segment],
        lockedPathSegmentsCount: lockedPathSegmentsCount
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
    const { records, currentPathSegments, uploadPathSegments, lockedPathSegmentsCount, currentDropTarget } = this.state;

    const currentPrefix = pathHelper.getPrefix(currentPathSegments);
    const canUpload = pathHelper.isInPath(currentPathSegments, uploadPathSegments);

    const browserClassNames = classNames({
      'RepositoryBrowser-browser': true,
      'RepositoryBrowser-browser--dropTarget': canUpload && currentDropTarget === currentPrefix
    });

    return (
      <div className="RepositoryBrowser">
        <div className="RepositoryBrowser-header">
          <div className="RepositoryBrowser-headerBreadCrumbs">
            {this.renderBreadCrumbs(currentPathSegments, lockedPathSegmentsCount)}
          </div>
          <div className="RepositoryBrowser-headerButtons">
            <Upload
              multiple
              disabled={!canUpload}
              showUploadList={false}
              customRequest={this.onCustomUpload}
              >
              <Button disabled={!canUpload}>
                <Icon type="upload" />&nbsp;<span>Dateien hochladen</span>
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
          {this.renderRecordsTable(records)}
        </div>
      </div>
    );
  }
}

RepositoryBrowser.propTypes = {
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

module.exports = inject({
  cdnApiClient: CdnApiClient
}, RepositoryBrowser);
