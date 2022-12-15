import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { Form, Button, Modal, Spin } from 'antd';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { useLocale } from '../../components/locale-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';

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

function DiagramNetEditor({ content, onContentChanged }) {
  const iframeRef = useRef();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('diagramNet');

  const { image, width } = content;

  const [iframeUrl, setIframeUrl] = useState(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const changeContent = useCallback(newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  }, [content, onContentChanged]);

  const handleDiagramChanged = useCallback((xml, data) => {
    changeContent({ xml, image: data });
  }, [changeContent]);

  const handleMessage = useCallback(event => {
    const currentIframe = iframeRef.current;

    if (!currentIframe || event.source !== currentIframe.contentWindow || !event.data.length) {
      return;
    }

    const message = JSON.parse(event.data);
    const receiver = currentIframe.contentWindow;

    switch (message.event) {
      case 'init':
        // Received when the editor is ready
        receiver.postMessage(JSON.stringify({ action: 'load', xml: content.xml }), '*');
        setIsEditorReady(true);
        break;
      case 'load':
        // Received when the document is loaded
        setIsEditorReady(true);
        break;
      case 'save':
        // Received when the user clicks save
        receiver.postMessage(JSON.stringify({ action: 'export', format: 'svg' }), '*');
        break;
      case 'export':
        // Received when the export request was processed
        handleDiagramChanged(message.xml, message.data);
        setIsEditorReady(false);
        setIframeUrl(null);
        break;
      case 'exit':
        // Received when the user clicks exit or after export
        setIsEditorReady(false);
        setIframeUrl(null);
        break;
      default:
        break;
    }
  }, [handleDiagramChanged, content]);

  const handleEditClick = () => {
    setIsEditorReady(false);
    setIframeUrl(createEmbeddedEditorUrl(uiLanguage));
  };

  const handleWidthChange = value => {
    changeContent({ width: value });
  };

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  return (
    <div className="DiagramNetEditor">
      <Form layout="horizontal">
        {!!image && (
          <Form.Item label={t('name')} {...FORM_ITEM_LAYOUT}>
            <img className="DiagramNetEditor-preview" src={image} />
          </Form.Item>
        )}
        <Form.Item label={image ? '\u00A0' : t('name')} {...FORM_ITEM_LAYOUT} colon={!image}>
          <Button type="primary" size="small" onClick={handleEditClick}>{t('editExternally')}</Button>
        </Form.Item>
        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
      </Form>
      <Modal
        title={null}
        footer={null}
        closable={false}
        open={!!iframeUrl}
        width={modalBodyStyle.width}
        bodyStyle={modalBodyStyle}
        destroyOnClose
        centered
        className="DiagramNetEditor-modal"
        >
        {!!iframeUrl && (
          <Fragment>
            {/* eslint-disable-next-line react/iframe-missing-sandbox */}
            <iframe ref={iframeRef} src={iframeUrl} frameBorder={0} style={iframeStyle} />
            {isEditorReady || <div style={iframeOverlayStyle}><Spin size="large" /></div>}
          </Fragment>
        )}
      </Modal>
    </div>
  );
}

DiagramNetEditor.propTypes = {
  ...sectionEditorProps
};

export default DiagramNetEditor;
