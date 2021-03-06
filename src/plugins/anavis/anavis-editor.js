import React from 'react';
import classNames from 'classnames';
import reactDropzoneNs from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import DeleteButton from '../../components/delete-button.js';
import MarkdownInput from '../../components/markdown-input.js';
import ResourcePicker from '../../components/resource-picker.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import MoveUpIcon from '../../components/icons/general/move-up-icon.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import MoveDownIcon from '../../components/icons/general/move-down-icon.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { Form, Input, Radio, Modal, Table, Button, Switch, InputNumber } from 'antd';
import { MEDIA_KIND, COLOR_SWATCHES, DEFAULT_COLOR, DEFAULT_LENGTH } from './constants.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const ButtonGroup = Button.Group;

function AnavisEditor({ content, onContentChanged }) {
  const { t } = useTranslation('anavis');
  const clientConfig = useService(ClientConfig);

  const { width, parts, media } = content;
  const { kind, sourceType, sourceUrl, copyrightNotice, aspectRatio } = media;
  const dataSource = parts.map((part, i) => ({ key: i, ...part }));

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValuesOrFunc => {
    if (typeof newContentValuesOrFunc === 'function') {
      onContentChanged(newContentValuesOrFunc(content));
    } else {
      onContentChanged({ ...content, ...newContentValuesOrFunc }, false);
    }
  };

  const handleSourceUrlValueChanged = newValue => {
    const newCopyrightNotice = sourceType === MEDIA_SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: newValue })
      : copyrightNotice;

    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        sourceUrl: newValue,
        copyrightNotice: newCopyrightNotice
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
        copyrightNotice: ''
      }
    }));
  };

  const handleAspectRatioChanged = event => {
    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        aspectRatio: event.target.value
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

  const handleCopyrightNoticeChanged = event => {
    changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        copyrightNotice: event.target.value
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
            <RadioButton value={MEDIA_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === MEDIA_SOURCE_TYPE.external && (
          <FormItem label={t('common:externalUrl')} {...formItemLayout}>
            <Input value={sourceUrl} onChange={handleExternalUrlValueChanged} />
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.internal && (
          <FormItem label={t('common:internalUrl')} {...formItemLayout}>
            <div className="u-input-and-button">
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={sourceUrl}
                onChange={handleInternalUrlValueChanged}
                />
              <ResourcePicker
                url={storageLocationPathToUrl(sourceUrl)}
                onUrlChange={url => handleInternalUrlFileNameChanged(urlToStorageLocationPath(url))}
                />
            </div>
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout}>
            <Input value={sourceUrl} onChange={handleYoutubeUrlValueChanged} />
          </FormItem>
        )}
        <Form.Item label={t('common:aspectRatio')} {...formItemLayout}>
          <RadioGroup defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine} value={aspectRatio} size="small" onChange={handleAspectRatioChanged}>
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
          </RadioGroup>
        </Form.Item>
        <Form.Item label={t('common:videoDisplay')} {...formItemLayout}>
          <Switch size="small" defaultChecked checked={kind === MEDIA_KIND.video} onChange={handleShowVideoChanged} />
        </Form.Item>
        <Form.Item label={t('common:width')} {...formItemLayout}>
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </Form.Item>
        <Form.Item label={t('common:copyrightNotice')} {...formItemLayout}>
          <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChanged} />
        </Form.Item>
      </Form>
      <ReactDropzone onDrop={handleJsonDrop} noKeyboard noClick>
        {({ getRootProps, isDragActive }) => (
          <div {...getRootProps({ className: classNames({ 'AnavisEditor-table': true, 'u-can-drop': isDragActive }) })}>
            <Table
              dataSource={dataSource}
              expandedRowRender={renderExpandedRow}
              columns={columns}
              pagination={false}
              bordered={false}
              size="small"
              />
          </div>
        )}
      </ReactDropzone>
    </div>
  );
}

AnavisEditor.propTypes = {
  ...sectionEditorProps
};

export default AnavisEditor;
