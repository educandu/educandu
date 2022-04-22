import React from 'react';
import Dropperx from 'dropperx';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import DeleteButton from '../../components/delete-button.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import StorageFilePicker from '../../components/storage-file-picker.js';
import MoveUpIcon from '../../components/icons/general/move-up-icon.js';
import MoveDownIcon from '../../components/icons/general/move-down-icon.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';
import { Form, Input, Radio, Modal, Table, Button, Switch, InputNumber } from 'antd';
import { MEDIA_KIND, SOURCE_TYPE, COLOR_SWATCHES, DEFAULT_COLOR, DEFAULT_LENGTH } from './constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;
const ButtonGroup = Button.Group;

function AnavisEditor({ content, onContentChanged, publicStorage, privateStorage }) {
  const { t } = useTranslation('anavis');
  const clientConfig = useService(ClientConfig);

  const { width, parts, media } = content;
  const { kind, sourceType, sourceUrl, text, aspectRatio } = media;
  const dataSource = parts.map((part, i) => ({ key: i, ...part }));

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = (newContentValuesOrFunc, isInvalid) => {
    if (typeof newContentValuesOrFunc === 'function') {
      onContentChanged(newContentValuesOrFunc(content), isInvalid);
    } else {
      onContentChanged({ ...content, ...newContentValuesOrFunc }, isInvalid);
    }
  };

  const handleSourceUrlValueChanged = newValue => {
    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        sourceUrl: newValue
      }
    }));
  };

  const handleExternalUrlValueChanged = event => {
    handleSourceUrlValueChanged(event.target.value);
  };

  const handleYoutubeUrlValueChanged = event => {
    handleSourceUrlValueChanged(event.target.value);
  };

  const handleInternalUrlValueChanged = e => {
    handleSourceUrlValueChanged(e.target.value);
  };

  const handleInternalUrlFileNameChanged = value => {
    handleSourceUrlValueChanged(value);
  };

  const handleSourceTypeValueChanged = event => {
    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        sourceType: event.target.value,
        sourceUrl: '',
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
        sourceType: event.target.value,
        sourceUrl: '',
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

  const handleNameInputChanged = (index, newValue) => {
    const newParts = parts.map((part, i) => i === index ? { ...part, name: newValue } : part);
    changeContent({ parts: newParts });
  };

  const handleColorInputChanged = (index, newValue) => {
    const newParts = parts.map((part, i) => i === index ? { ...part, color: newValue } : part);
    changeContent({ parts: newParts });
  };

  const handleLengthInputChanged = (index, newValue) => {
    const newParts = parts.map((part, i) => i === index ? { ...part, length: Number.parseInt(newValue, 10) } : part);
    changeContent({ parts: newParts });
  };

  const handleDeleteButtonClick = index => {
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

  const handleUpCircleButtonClick = index => {
    const newParts = swapItemsAt(parts, index, index - 1);
    changeContent({ parts: newParts });
  };

  const handleDownCircleButtonClick = index => {
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
          <div key={annotationIndex.toString()} className="AnavisEditor-annotation">
            <div className="AnavisEditor-annotationInput">
              <Input value={annotation} onChange={event => handleAnnotationChange(event, partIndex, annotationIndex)} />
            </div>
            <div className="AnavisEditor-annotationDelete">
              <DeleteButton onClick={() => handleDeleteAnnotationButtonClick(annotationIndex)} />
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
            disabled={index === 0}
            icon={<MoveUpIcon />}
            onClick={() => handleUpCircleButtonClick(index)}
            />
          <Button
            disabled={index === parts.length - 1}
            icon={<MoveDownIcon />}
            onClick={() => handleDownCircleButtonClick(index)}
            />
        </ButtonGroup>
      )
    }, {
      title: () => t('nameLabel'),
      dataIndex: 'name',
      key: 'name',
      render: (name, item, index) => (
        <Input
          value={name}
          onChange={event => handleNameInputChanged(index, event.target.value)}
          />
      )
    }, {
      title: () => t('color'),
      dataIndex: 'color',
      key: 'color',
      render: (color, item, index) => (
        <ColorPicker
          width={382}
          colors={COLOR_SWATCHES}
          color={color}
          onChange={value => handleColorInputChanged(index, value)}
          />
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
          formatter={value => value?.toString() || ''}
          onChange={value => handleLengthInputChanged(index, value)}
          />
      )
    }, {
      title: (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddPartButtonClick}
          />
      ),
      width: 48,
      key: 'button',
      render: (value, item, index) => (
        <DeleteButton onClick={() => handleDeleteButtonClick(index)} />
      )
    }
  ];

  return (
    <div className="AnavisEditor">
      <Form layout="horizontal">
        <FormItem label={t('common:source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleSourceTypeValueChanged}>
            <RadioButton value={SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === SOURCE_TYPE.external && (
          <FormItem label={t('common:externalUrl')} {...formItemLayout}>
            <Input value={sourceUrl} onChange={handleExternalUrlValueChanged} />
          </FormItem>
        )}
        {sourceType === SOURCE_TYPE.internal && (
          <FormItem label={t('common:internalUrl')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={sourceUrl}
                onChange={handleInternalUrlValueChanged}
                />
              <StorageFilePicker
                publicStorage={publicStorage}
                privateStorage={privateStorage}
                fileName={sourceUrl}
                onFileNameChanged={handleInternalUrlFileNameChanged}
                />
            </div>
          </FormItem>
        )}
        {sourceType === SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout}>
            <Input value={sourceUrl} onChange={handleYoutubeUrlValueChanged} />
          </FormItem>
        )}
        <Form.Item label={t('common:aspectRatio')} {...formItemLayout}>
          <RadioGroup defaultValue="16:9" value={`${aspectRatio.h}:${aspectRatio.v}`} size="small" onChange={handleAspectRatioChanged}>
            <RadioButton value="16:9">16:9</RadioButton>
            <RadioButton value="4:3">4:3</RadioButton>
          </RadioGroup>
        </Form.Item>
        <Form.Item label={t('common:videoDisplay')} {...formItemLayout}>
          <Switch size="small" defaultChecked checked={kind === MEDIA_KIND.video} onChange={handleShowVideoChanged} />
        </Form.Item>
        <Form.Item label={t('common:width')} {...formItemLayout}>
          <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={handleWidthChanged} />
        </Form.Item>
        <Form.Item label={t('common:copyrightInfos')} {...formItemLayout}>
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
