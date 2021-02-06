import React from 'react';
import dauria from 'dauria';
import autoBind from 'auto-bind';
import { Form, Button } from 'antd';
import { withTranslation } from 'react-i18next';
import { withLanguage } from '../../../components/language-context';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider';
import { sectionEditorProps, translationProps, languageProps } from '../../../ui/default-prop-types';

const createEmbeddedEditorUrl = lang => [
  'https://embed.diagrams.net/',
  '?embed=1',
  '&ui=atlas',
  '&spin=1',
  '&modified=unsavedChanges',
  '&noSaveBtn=1',
  '&proto=json',
  `&lang=${lang}`
].join('');

const embeddedEditorStyle = [
  'background-color: #fff;',
  'border: 0;',
  'position: absolute;',
  'top: 0;',
  'left: 0;',
  'right: 0;',
  'bottom: 0;',
  'width: 100%;',
  'height: 100%;',
  'z-index: 9999;'
].join(' ');

class DiagramNetEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      drawIoFrame: null
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
    const { drawIoFrame } = this.state;

    if (!drawIoFrame || event.source !== drawIoFrame.contentWindow || !event.data.length) {
      return;
    }

    const message = JSON.parse(event.data);

    let svgXml;
    switch (message.event) {
      case 'init':
        // Received if the editor is ready
        // Sends the data URI with embedded XML to editor
        drawIoFrame.contentWindow.postMessage(JSON.stringify({ action: 'load', xml: content.svgXml }), '*');
        break;
      case 'save':
        // Received if the user clicks save
        // Sends a request to export the diagram as XML with embedded PNG
        drawIoFrame.contentWindow.postMessage(JSON.stringify({ action: 'export', format: 'xmlsvg' }), '*');
        break;
      case 'export':
        // Received if the export request was processed
        // Contains the data URI of the image SVG
        svgXml = dauria.parseDataURI(message.data).buffer.toString('utf8');
        this.handleSvgXmlChanged(svgXml);
        this.setState({ drawIoFrame: null });
        document.body.removeChild(drawIoFrame);
        break;
      case 'exit':
        // Received if the user clicks exit or after export
        this.setState({ drawIoFrame: null });
        document.body.removeChild(drawIoFrame);
        break;
      default:
        break;
    }
  }

  handleEditClick() {
    const { language } = this.props;
    const { drawIoFrame } = this.state;
    if (!drawIoFrame || drawIoFrame.closed) {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('src', createEmbeddedEditorUrl(language));
      iframe.setAttribute('style', embeddedEditorStyle);
      document.body.appendChild(iframe);
      this.setState({ drawIoFrame: iframe });
    } else {
      drawIoFrame.focus();
    }
  }

  handleSvgXmlChanged(value) {
    this.changeContent({ svgXml: value });
  }

  handleMaxWidthChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content, t } = this.props;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label={t('name')} {...formItemLayout}>
            <Button type="primary" onClick={this.handleEditClick}>{t('editExternally')}</Button>
          </Form.Item>
          <Form.Item label={t('maximumWidth')} {...formItemLayout}>
            <ObjectMaxWidthSlider value={content.maxWidth} onChange={this.handleMaxWidthChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

DiagramNetEditor.propTypes = {
  ...translationProps,
  ...languageProps,
  ...sectionEditorProps
};

export default withTranslation('diagramNet')(withLanguage(DiagramNetEditor));

