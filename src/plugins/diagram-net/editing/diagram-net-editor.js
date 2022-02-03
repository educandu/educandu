import autoBind from 'auto-bind';
import { withTranslation } from 'react-i18next';
import { Form, Button, Modal, Spin } from 'antd';
import React, { Fragment, createRef } from 'react';
import { withLocale } from '../../../components/locale-context.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';
import { sectionEditorProps, translationProps, uiLanguageProps } from '../../../ui/default-prop-types.js';

const createEmbeddedEditorUrl = lang => [
  'https://embed.diagrams.net/',
  '?embed=1',
  '&ui=atlas',
  '&modified=unsavedChanges',
  '&noSaveBtn=1',
  '&proto=json',
  `&lang=${lang}`
].join('');

const modalBodyStyle = {
  position: 'relative',
  height: 'calc(100vh - 120px)',
  width: 'calc(100vw - 120px)',
  overflow: 'hidden',
  margin: 0,
  padding: 0
};

const iframeStyle = {
  position: 'absolute',
  height: '100%',
  width: '100%',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
};

const iframeOverlayStyle = {
  ...iframeStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fff'
};

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

class DiagramNetEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.iframeRef = createRef();
    this.state = {
      iframeUrl: null,
      isEditorReady: false
    };
  }

  componentDidMount() {
    window.addEventListener('message', this.handleMessage);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage);
  }

  handleMessage(event) {
    const { content } = this.props;
    const currentIframe = this.iframeRef.current;

    if (!currentIframe || event.source !== currentIframe.contentWindow || !event.data.length) {
      return;
    }

    const message = JSON.parse(event.data);
    const receiver = currentIframe.contentWindow;

    switch (message.event) {
      case 'init':
        // Received when the editor is ready
        receiver.postMessage(JSON.stringify({ action: 'load', xml: content.xml }), '*');
        this.setState({ isEditorReady: true });
        break;
      case 'load':
        // Received when the document is loaded
        this.setState({ isEditorReady: true });
        break;
      case 'save':
        // Received when the user clicks save
        receiver.postMessage(JSON.stringify({ action: 'export', format: 'svg' }), '*');
        break;
      case 'export':
        // Received when the export request was processed
        this.handleDiagramChanged(message.xml, message.data);
        this.setState({ iframeUrl: null, isEditorReady: false });
        break;
      case 'exit':
        // Received when the user clicks exit or after export
        this.setState({ iframeUrl: null, isEditorReady: false });
        break;
      default:
        break;
    }
  }

  handleEditClick() {
    const { uiLanguage } = this.props;
    this.setState({
      iframeUrl: createEmbeddedEditorUrl(uiLanguage),
      isEditorReady: false
    });
  }

  handleDiagramChanged(xml, image) {
    this.changeContent({ xml, image });
  }

  handleMaxWidthChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { iframeUrl, isEditorReady } = this.state;
    const { content, t } = this.props;
    const { image, maxWidth } = content;
    return (
      <div>
        <Form layout="horizontal">
          {image && (
            <Form.Item label={t('name')} {...formItemLayout}>
              <img style={{ maxHeight: '80px', maxWidth: '400px', border: '1px solid #d9d9d9' }} src={image} />
            </Form.Item>
          )}
          <Form.Item label={image ? '\u00A0' : t('name')} {...formItemLayout} colon={!image}>
            <Button type="primary" size="small" onClick={this.handleEditClick}>{t('editExternally')}</Button>
          </Form.Item>
          <Form.Item label={t('maximumWidth')} {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthChanged} />
          </Form.Item>
        </Form>
        <Modal
          title={null}
          footer={null}
          closable={false}
          visible={!!iframeUrl}
          width={modalBodyStyle.width}
          bodyStyle={modalBodyStyle}
          destroyOnClose
          centered
          >
          {iframeUrl && (
            <Fragment>
              <iframe ref={this.iframeRef} src={iframeUrl} frameBorder={0} style={iframeStyle} />
              {isEditorReady || <div style={iframeOverlayStyle}><Spin size="large" /></div>}
            </Fragment>
          )}
        </Modal>
      </div>
    );
  }
}

DiagramNetEditor.propTypes = {
  ...translationProps,
  ...uiLanguageProps,
  ...sectionEditorProps
};

export default withTranslation('diagramNet')(withLocale(DiagramNetEditor));
