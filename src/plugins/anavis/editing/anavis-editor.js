import React from 'react';
import Dropperx from 'dropperx';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import ColorPicker from '../../../components/color-picker.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import { useService } from '../../../components/container-context.js';
import { sectionEditorProps } from '../../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../../utils/array-utils.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';
import { Form, Input, Radio, Modal, Table, Button, Switch, InputNumber } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { MEDIA_KIND, MEDIA_TYPE, COLOR_SWATCHES, DEFAULT_COLOR, DEFAULT_LENGTH } from '../constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;
const ButtonGroup = Button.Group;

function AnavisEditor({ sectionContainerId, content, onContentChanged }) {
  const { t } = useTranslation('anavis');
  const clientConfig = useService(ClientConfig);

  const { width, parts, media } = content;
  const { kind, type, url, text, aspectRatio } = media;
  const dataSource = parts.map((part, i) => ({ key: i, ...part }));

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValuesOrFunc => {
    if (typeof newContentValuesOrFunc === 'function') {
      onContentChanged(newContentValuesOrFunc(content));
    } else {
      onContentChanged({ ...content, ...newContentValuesOrFunc });
    }
  };

  const handleMediaUrlChanged = newValue => {
    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        url: newValue
      }
    }));
  };

  const handleExternalUrlValueChanged = event => {
    handleMediaUrlChanged(event.target.value);
  };

  const handleYoutubeUrlValueChanged = event => {
    handleMediaUrlChanged(event.target.value);
  };

  const handleInternalUrlValueChanged = e => {
    handleMediaUrlChanged(e.target.value);
  };

  const handleInternalUrlFileNameChanged = value => {
    handleMediaUrlChanged(value);
  };

  const handleTypeValueChanged = event => {
    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        type: event.target.value,
        url: '',
        aspectRatio: {
          h: 16,
          v: 9
        }
      }
    }));
  };

  const handleAspectRatioChanged = event => {
    const [h, v] = event.target.value.split(':').map(Number);
    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        type: event.target.value,
        url: '',
        aspectRatio: { h, v }
      }
    }));
  };

  const handleShowVideoChanged = showVideo => {
    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        kind: showVideo ? MEDIA_KIND.video : MEDIA_KIND.audio
      }
    }));
  };

  const handleTextChanged = event => {
    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        text: event.target.value
      }
    }));
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleNameInputChanged = event => {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newParts = parts.map((part, i) => i === index ? { ...part, name: value } : part);
    changeContent({ parts: newParts });
  };

  const handleColorInputChanged = (value, index) => {
    const newParts = parts.map((part, i) => i === index ? { ...part, color: value } : part);
    changeContent({ parts: newParts });
  };

  const handleLengthInputChanged = (value, index) => {
    const newParts = parts.map((part, i) => i === index ? { ...part, length: Number.parseInt(value, 10) } : part);
    changeContent({ parts: newParts });
  };

  const handleDeleteButtonClick = event => {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newParts = removeItemAt(parts, index);
    changeContent({ parts: newParts });
  };

  const handleAddAnnotationButtonClick = () => {
    const newParts = parts.map(part => ({
      ...part,
      annotations: [...part.annotations, '']
    }));

    changeContent({ parts: newParts });
  };

  const handleDeleteAnnotationButtonClick = annotationIndex => {
    const newParts = parts.map(part => ({
      ...part,
      annotations: part.annotations.filter((a, i) => i !== annotationIndex)
    }));

    changeContent({ parts: newParts });
  };

  const handleAddPartButtonClick = () => {
    const newParts = parts.slice();
    newParts.push({ name: t('defaultPartName'), color: DEFAULT_COLOR, length: DEFAULT_LENGTH, annotations: [] });
    changeContent({ parts: newParts });
  };

  const handleUpCircleButtonClick = event => {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newParts = swapItemsAt(parts, index, index - 1);
    changeContent({ parts: newParts });
  };

  const handleDownCircleButtonClick = event => {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newParts = swapItemsAt(parts, index, index + 1);
    changeContent({ parts: newParts });
  };

  const handleAnnotationChange = (event, partIndex, annotationIndex) => {
    const newParts = parts.map((p, pi) => ({
      ...p,
      annotations: p.annotations.map((a, ai) => pi === partIndex && ai === annotationIndex ? event.target.value : a)
    }));

    changeContent({ parts: newParts });
  };

  const handleJsonDrop = files => {
    try {
      const ejected = JSON.parse(files[0].content);
      if (ejected.version !== '2') {
        Modal.error({ title: t('common:error'), content: t('unsupportedFileFormat') });
        return;
      }

      const newParts = ejected.parts.map((ejectedPart, index) => ({
        name: ejectedPart.name,
        color: ejectedPart.color,
        length: ejectedPart.length,
        annotations: ejected.annotations.map(ejectedAnnotation => ejectedAnnotation.values[index])
      }));

      changeContent({ parts: newParts });
    } catch (error) {
      Modal.error({ title: t('common:error'), content: error.message });
    }
  };

  const renderExpandedRow = (part, partIndex) => {
    return (
      <div>
        {part.annotations.map((annotation, annotationIndex) => (
          <div key={annotationIndex.toString()} style={{ display: 'flex', marginTop: annotationIndex === 0 ? '0' : '4px' }}>
            <div style={{ flex: '1 0 0%', marginRight: '8px' }}>
              <Input value={annotation} onChange={event => handleAnnotationChange(event, partIndex, annotationIndex)} />
            </div>
            <div style={{ flex: 'none', marginLeft: '8px' }}>
              <Button type="danger" icon={<DeleteOutlined />} onClick={() => handleDeleteAnnotationButtonClick(annotationIndex)} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: part.annotations.length === 0 ? '0' : '4px' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAnnotationButtonClick} />
        </div>
      </div>
    );
  };

  const columns = [
    {
      width: 80,
      key: 'upDown',
      render: (upDown, item, index) => (
        <ButtonGroup>
          <Button
            data-index={index}
            disabled={index === 0}
            icon={<ArrowUpOutlined />}
            onClick={handleUpCircleButtonClick}
            />
          <Button
            data-index={index}
            disabled={index === parts.length - 1}
            icon={<ArrowDownOutlined />}
            onClick={handleDownCircleButtonClick}
            />
        </ButtonGroup>
      )
    }, {
      title: () => t('nameLabel'),
      dataIndex: 'name',
      key: 'name',
      render: (name, item, index) => (
        <Input data-index={index} value={name} onChange={handleNameInputChanged} />
      )
    }, {
      title: () => t('color'),
      dataIndex: 'color',
      key: 'color',
      render: (color, item, index) => (
        <ColorPicker width={382} colors={COLOR_SWATCHES} color={color} onChange={value => handleColorInputChanged(value, index)} />
      )
    }, {
      title: () => t('length'),
      dataIndex: 'length',
      key: 'length',
      render: (length, item, index) => (
        <InputNumber
          className="u-width-100"
          min={0}
          max={Number.MAX_VALUE}
          step={1}
          precision={0}
          value={length}
          parser={value => Number.parseInt(value, 10) || 0}
          formatter={value => value ? value.toString() : ''}
          onChange={value => handleLengthInputChanged(value, index)}
          />
      )
    }, {
      title: (
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPartButtonClick} />
      ),
      width: 48,
      key: 'button',
      render: (value, item, index) => (
        <Button data-index={index} type="danger" icon={<DeleteOutlined />} onClick={handleDeleteButtonClick} />
      )
    }
  ];

  return (
    <div className="AnavisEditor">
      <Form layout="horizontal">
        <FormItem label={t('source')} {...formItemLayout}>
          <RadioGroup value={type} onChange={handleTypeValueChanged}>
            <RadioButton value={MEDIA_TYPE.external}>{t('externalLink')}</RadioButton>
            <RadioButton value={MEDIA_TYPE.internal}>{t('internalCdn')}</RadioButton>
            <RadioButton value={MEDIA_TYPE.youtube}>{t('youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {type === MEDIA_TYPE.external && (
          <FormItem label={t('externalUrl')} {...formItemLayout}>
            <Input value={url} onChange={handleExternalUrlValueChanged} />
          </FormItem>
        )}
        {type === MEDIA_TYPE.internal && (
          <FormItem label={t('internalUrl')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={url}
                onChange={handleInternalUrlValueChanged}
                />
              <CdnFilePicker
                rootPrefix="media"
                uploadPrefix={`media/${sectionContainerId}`}
                initialPrefix={`media/${sectionContainerId}`}
                fileName={url}
                onFileNameChanged={handleInternalUrlFileNameChanged}
                />
            </div>
          </FormItem>
        )}
        {type === MEDIA_TYPE.youtube && (
          <FormItem label={t('youtubeUrl')} {...formItemLayout}>
            <Input value={url} onChange={handleYoutubeUrlValueChanged} />
          </FormItem>
        )}
        <Form.Item label={t('aspectRatio')} {...formItemLayout}>
          <RadioGroup defaultValue="16:9" value={`${aspectRatio.h}:${aspectRatio.v}`} size="small" onChange={handleAspectRatioChanged}>
            <RadioButton value="16:9">16:9</RadioButton>
            <RadioButton value="4:3">4:3</RadioButton>
          </RadioGroup>
        </Form.Item>
        <Form.Item label={t('videoDisplay')} {...formItemLayout}>
          <Switch size="small" defaultChecked checked={kind === MEDIA_KIND.video} onChange={handleShowVideoChanged} />
        </Form.Item>
        <Form.Item label={t('width')} {...formItemLayout}>
          <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={handleWidthChanged} />
        </Form.Item>
        <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
          <TextArea value={text} onChange={handleTextChanged} autoSize={{ minRows: 3 }} />
        </Form.Item>
      </Form>
      <Dropperx accept="application/json" maxSize={500000} onDrop={handleJsonDrop}>
        {({ canDrop }) => (
          <Table
            className={classNames({ 'AnavisEditor-table': true, 'u-can-drop': canDrop })}
            dataSource={dataSource}
            expandedRowRender={renderExpandedRow}
            columns={columns}
            pagination={false}
            size="small"
            />
        )}
      </Dropperx>
    </div>
  );
}

AnavisEditor.propTypes = {
  ...sectionEditorProps
};

export default AnavisEditor;
