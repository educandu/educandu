const React = require('react');
const moment = require('moment');
const firstBy = require('thenby');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const prettyBytes = require('pretty-bytes');
const selection = require('../ui/selection');
const pathHelper = require('../ui/path-helper');
const browserHelper = require('../ui/browser-helper');
const { inject } = require('./container-context.jsx');
const mimeTypeHelper = require('../ui/mime-type-helper');
const CdnApiClient = require('../services/cdn-api-client');
const { Table, Divider, Icon, Breadcrumb, message } = require('antd');

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

    this.state = {
      records: [],
      loading: false,
      selectedRowKeys: [],
      currentDropTarget: null,
      currentPathSegments: rootPathSegments,
      lockedPathSegmentsCount: rootPathSegments.length
    };

    this.columns = [
      {
        title: 'Name',
        dataIndex: 'displayName',
        key: 'displayName',
        align: 'left',
        render: this.renderNameColumn,
        sorter: firstBy('isDirectory', { direction: -1 }).thenBy('displayName', { ignoreCase: true }),
        defaultSortOrder: 'ascend'
      },
      {
        title: 'Typ',
        dataIndex: 'categoryText',
        key: 'categoryText',
        align: 'left',
        width: 150,
        sorter: firstBy('categoryText', { ignoreCase: true })
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
      },
      {
        title: 'Aktion',
        key: 'action',
        align: 'right',
        width: 250,
        render: this.renderActionsColumn
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

  shouldComponentUpdate() {
    return true;
  }

  componentWillUnmount() {
    window.removeEventListener('dragover', this.handleWindowDragOverOrDrop);
    window.removeEventListener('drop', this.handleWindowDragOverOrDrop);
  }

  sortRecordsByName(a, b) {
    return firstBy('isDirectory', { direction: -1 }).thenBy('displayName', { ignoreCase: true })(a, b);
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
    this.setState({ loading: true });

    const { cdnApiClient } = this.props;
    const prefix = pathHelper.getPrefix(pathSegments);
    const result = await cdnApiClient.getObjects(prefix);
    const records = this.convertObjectsToRecords(result.objects);
    const selectedRowKeys = selection.removeInvalidKeys(keysToSelect, records.map(r => r.key));

    this.setState({
      records: records,
      selectedRowKeys: selectedRowKeys,
      currentPathSegments: pathSegments,
      loading: false
    });
  }

  async uploadFiles(pathSegments, files) {
    this.setState({ loading: true });

    const { cdnApiClient } = this.props;
    const prefix = pathHelper.getPrefix(pathSegments);

    const hide = message.loading('Datei-Upload', 0);
    await cdnApiClient.uploadFiles(files, prefix);

    const { currentPathSegments, selectedRowKeys } = this.state;
    await this.refreshFiles(currentPathSegments, selectedRowKeys);

    hide();
    message.success('Upload erfolgreich');
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
        sizeText: obj.size ? prettyBytes(obj.size, { locale: BROWSER_LOCALE }) : '---',
        lastModified: obj.lastModified,
        lastModifiedText: obj.lastModified ? moment(obj.lastModified).locale(BROWSER_LOCALE).format('lll') : '---',
        displayName: segments[segments.length - 1] || '',
        isDirectory: isDirectory,
        category: category,
        categoryText: localizeCategory(category),
        originalObject: obj,
        rowProps: {}
      };

      record.rowProps.onClick = () => this.handleRecordClick(record);

      if (record.isDirectory) {
        record.rowProps['data-drop-target'] = path;
      }

      return record;
    });
  }

  handleBreadCrumbClick(breadCrumb) {
    const { selectedRowKeys } = this.state;
    this.refreshFiles(breadCrumb.segments, selectedRowKeys);
  }

  handleRecordClick(record) {
    return record.isDirectory ? this.handleDirectoryClick(record) : this.handleFileClick(record);
  }

  handleDirectoryClick(record) {
    const { selectedRowKeys } = this.state;
    return this.refreshFiles(pathHelper.getPathSegments(record.path), selectedRowKeys);
  }

  handleRow(record) {
    return record.rowProps;
  }

  handleFileClick(record) {
    const { selectedRowKeys, records } = this.state;
    const { selectionMode, onSelectionChanged } = this.props;

    const newSelectedRowKeys = selectedRowKeys.includes(record.key)
      ? selection.removeKeyFromSelection(selectedRowKeys, record.key, selectionMode)
      : selection.addKeyToSelection(selectedRowKeys, record.key, selectionMode);

    this.setState({ selectedRowKeys: newSelectedRowKeys });

    onSelectionChanged(selectedRowKeys.map(key => records.find(r => r.key === key).originalObject));
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
    const { loading } = this.state;

    return (
      <Table
        bordered={false}
        pagination={false}
        size="middle"
        columns={this.columns}
        dataSource={records}
        rowClassName={this.getRowClassName}
        loading={loading}
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
    const { records, currentPathSegments, lockedPathSegmentsCount, currentDropTarget } = this.state;

    const currentPrefix = pathHelper.getPrefix(currentPathSegments);

    const browserClassNames = classNames({
      'RepositoryBrowser-browser': true,
      'RepositoryBrowser-browser--dropTarget': currentDropTarget === currentPrefix
    });

    return (
      <div className="RepositoryBrowser PageContent">
        {this.renderBreadCrumbs(currentPathSegments, lockedPathSegmentsCount)}
        <div
          ref={this.browserRef}
          className={browserClassNames}
          onDragOver={this.handleFrameDrag}
          onDragLeave={this.handleFrameLeave}
          onDrop={this.handleFrameDrop}
          data-drop-target={currentPrefix}
          >
          {this.renderRecordsTable(records)}
        </div>
      </div>
    );
  }
}

RepositoryBrowser.propTypes = {
  cdnApiClient: PropTypes.instanceOf(CdnApiClient).isRequired,
  onSelectionChanged: PropTypes.func,
  rootPrefix: PropTypes.string.isRequired,
  selectionMode: PropTypes.oneOf([selection.NONE, selection.SINGLE, selection.MULTIPLE])
};

RepositoryBrowser.defaultProps = {
  onSelectionChanged: () => {},
  selectionMode: selection.NONE
};

module.exports = inject({
  cdnApiClient: CdnApiClient
}, RepositoryBrowser);
