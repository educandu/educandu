import React from 'react';
import Dropperx from 'dropperx';
import autoBind from 'auto-bind';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import ColorPicker from '../../../components/color-picker.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { inject } from '../../../components/container-context.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import { swapItemsAt, removeItemAt } from '../../../utils/array-utils.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';
import { Form, Input, Radio, Modal, Table, Button, Switch, InputNumber } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { MEDIA_KIND, MEDIA_TYPE, COLOR_SWATCHES, DEFAULT_COLOR, DEFAULT_LENGTH } from '../constants.js';
import { sectionEditorProps, clientConfigProps, translationProps } from '../../../ui/default-prop-types.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;
const ButtonGroup = Button.Group;

class AnavisEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.columns = [
      {
        width: 80,
        key: 'upDown',
        render: (upDown, item, index) => (
          <ButtonGroup>
            <Button
              data-index={index}
              disabled={index === 0}
              icon={<ArrowUpOutlined />}
              onClick={this.handleUpCircleButtonClick}
              />
            <Button
              data-index={index}
              disabled={index === this.props.content.parts.length - 1}
              icon={<ArrowDownOutlined />}
              onClick={this.handleDownCircleButtonClick}
              />
          </ButtonGroup>
        )
      }, {
        title: () => this.props.t('nameLabel'),
        dataIndex: 'name',
        key: 'name',
        render: (name, item, index) => (
          <Input data-index={index} value={name} onChange={this.handleNameInputChanged} />
        )
      }, {
        title: () => this.props.t('color'),
        dataIndex: 'color',
        key: 'color',
        render: (color, item, index) => (
          <ColorPicker width={382} colors={COLOR_SWATCHES} color={color} onChange={value => this.handleColorInputChanged(value, index)} />
        )
      }, {
        title: () => this.props.t('length'),
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
            onChange={value => this.handleLengthInputChanged(value, index)}
            />
        )
      }, {
        title: (
          <Button type="primary" icon={<PlusOutlined />} onClick={this.handleAddPartButtonClick} />
        ),
        width: 48,
        key: 'button',
        render: (value, item, index) => (
          <Button data-index={index} type="danger" icon={<DeleteOutlined />} onClick={this.handleDeleteButtonClick} />
        )
      }
    ];
  }

  handleMediaUrlChanged(newValue) {
    this.changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        url: newValue
      }
    }));
  }

  handleExternalUrlValueChanged(event) {
    this.handleMediaUrlChanged(event.target.value);
  }

  handleYoutubeUrlValueChanged(event) {
    this.handleMediaUrlChanged(event.target.value);
  }

  handleInternalUrlValueChanged(e) {
    this.handleMediaUrlChanged(e.target.value);
  }

  handleInternalUrlFileNameChanged(value) {
    this.handleMediaUrlChanged(value);
  }

  handleTypeValueChanged(event) {
    this.changeContent(oldContent => ({
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
  }

  handleAspectRatioChanged(event) {
    const [h, v] = event.target.value.split(':').map(Number);
    this.changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        type: event.target.value,
        url: '',
        aspectRatio: { h, v }
      }
    }));
  }

  handleShowVideoChanged(showVideo) {
    this.changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        kind: showVideo ? MEDIA_KIND.video : MEDIA_KIND.audio
      }
    }));
  }

  handleTextChanged(event) {
    this.changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        text: event.target.value
      }
    }));
  }

  handleWidthChanged(newValue) {
    this.changeContent({ width: newValue });
  }

  handleNameInputChanged(event) {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldParts = this.props.content.parts;
    const newParts = oldParts.map((part, i) => i === index ? { ...part, name: value } : part);
    this.changeContent({ parts: newParts });
  }

  handleColorInputChanged(value, index) {
    const oldParts = this.props.content.parts;
    const newParts = oldParts.map((part, i) => i === index ? { ...part, color: value } : part);
    this.changeContent({ parts: newParts });
  }

  handleLengthInputChanged(value, index) {
    const oldParts = this.props.content.parts;
    const newParts = oldParts.map((part, i) => i === index ? { ...part, length: Number.parseInt(value, 10) } : part);
    this.changeContent({ parts: newParts });
  }

  handleDeleteButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldParts = this.props.content.parts;
    const newParts = removeItemAt(oldParts, index);
    this.changeContent({ parts: newParts });
  }

  handleAddAnnotationButtonClick() {
    const newParts = this.props.content.parts.map(part => ({
      ...part,
      annotations: [...part.annotations, '']
    }));

    this.changeContent({ parts: newParts });
  }

  handleDeleteAnnotationButtonClick(annotationIndex) {
    const newParts = this.props.content.parts.map(part => ({
      ...part,
      annotations: part.annotations.filter((a, i) => i !== annotationIndex)
    }));

    this.changeContent({ parts: newParts });
  }

  handleAddPartButtonClick() {
    const { t } = this.props;
    const newParts = this.props.content.parts.slice();
    newParts.push({ name: t('defaultPartName'), color: DEFAULT_COLOR, length: DEFAULT_LENGTH, annotations: [] });
    this.changeContent({ parts: newParts });
  }

  handleUpCircleButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newParts = swapItemsAt(this.props.content.parts, index, index - 1);
    this.changeContent({ parts: newParts });
  }

  handleDownCircleButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newParts = swapItemsAt(this.props.content.parts, index, index + 1);
    this.changeContent({ parts: newParts });
  }

  handleAnnotationChange(event, partIndex, annotationIndex) {
    const newParts = this.props.content.parts.map((p, pi) => ({
      ...p,
      annotations: p.annotations.map((a, ai) => pi === partIndex && ai === annotationIndex ? event.target.value : a)
    }));

    this.changeContent({ parts: newParts });
  }

  handleJsonDrop(files) {
    const { t } = this.props;
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

      this.changeContent({ parts: newParts });
    } catch (error) {
      Modal.error({ title: t('common:error'), content: error.message });
    }
  }

  changeContent(newContentValuesOrFunc) {
    const { content, onContentChanged } = this.props;
    if (typeof newContentValuesOrFunc === 'function') {
      onContentChanged(newContentValuesOrFunc(content));
    } else {
      onContentChanged({ ...content, ...newContentValuesOrFunc });
    }
  }

  renderExpandedRow(part, partIndex) {
    return (
      <div>
        {part.annotations.map((annotation, annotationIndex) => (
          <div key={annotationIndex.toString()} style={{ display: 'flex', marginTop: annotationIndex === 0 ? '0' : '4px' }}>
            <div style={{ flex: '1 0 0%', marginRight: '8px' }}>
              <Input value={annotation} onChange={event => this.handleAnnotationChange(event, partIndex, annotationIndex)} />
            </div>
            <div style={{ flex: 'none', marginLeft: '8px' }}>
              <Button type="danger" icon={<DeleteOutlined />} onClick={() => this.handleDeleteAnnotationButtonClick(annotationIndex)} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: part.annotations.length === 0 ? '0' : '4px' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={this.handleAddAnnotationButtonClick} />
        </div>
      </div>
    );
  }

  render() {
    const { sectionContainerId, content, clientConfig, t } = this.props;
    const { width, parts, media } = content;
    const { kind, type, url, text, aspectRatio } = media;

    const dataSource = parts.map((part, i) => ({ key: i, ...part }));

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div className="AnavisEditor">
        <Form layout="horizontal">
          <FormItem label={t('source')} {...formItemLayout}>
            <RadioGroup value={type} onChange={this.handleTypeValueChanged}>
              <RadioButton value={MEDIA_TYPE.external}>{t('externalLink')}</RadioButton>
              <RadioButton value={MEDIA_TYPE.internal}>{t('internalCdn')}</RadioButton>
              <RadioButton value={MEDIA_TYPE.youtube}>{t('youtube')}</RadioButton>
            </RadioGroup>
          </FormItem>
          {type === MEDIA_TYPE.external && (
            <FormItem label={t('externalUrl')} {...formItemLayout}>
              <Input value={url} onChange={this.handleExternalUrlValueChanged} />
            </FormItem>
          )}
          {type === MEDIA_TYPE.internal && (
            <FormItem label={t('internalUrl')} {...formItemLayout}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${clientConfig.cdnRootUrl}/`}
                  value={url}
                  onChange={this.handleInternalUrlValueChanged}
                  />
                <CdnFilePicker
                  rootPrefix="media"
                  uploadPrefix={`media/${sectionContainerId}`}
                  initialPrefix={`media/${sectionContainerId}`}
                  fileName={url}
                  onFileNameChanged={this.handleInternalUrlFileNameChanged}
                  />
              </div>
            </FormItem>
          )}
          {type === MEDIA_TYPE.youtube && (
            <FormItem label={t('youtubeUrl')} {...formItemLayout}>
              <Input value={url} onChange={this.handleYoutubeUrlValueChanged} />
            </FormItem>
          )}
          <Form.Item label={t('aspectRatio')} {...formItemLayout}>
            <RadioGroup defaultValue="16:9" value={`${aspectRatio.h}:${aspectRatio.v}`} size="small" onChange={this.handleAspectRatioChanged}>
              <RadioButton value="16:9">16:9</RadioButton>
              <RadioButton value="4:3">4:3</RadioButton>
            </RadioGroup>
          </Form.Item>
          <Form.Item label={t('videoDisplay')} {...formItemLayout}>
            <Switch size="small" defaultChecked checked={kind === MEDIA_KIND.video} onChange={this.handleShowVideoChanged} />
          </Form.Item>
          <Form.Item label={t('widthUrl')} {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={this.handleWidthChanged} />
          </Form.Item>
          <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
            <TextArea value={text} onChange={this.handleTextChanged} autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
        <Dropperx accept="application/json" maxSize={500000} onDrop={this.handleJsonDrop}>
          {({ canDrop }) => (
            <Table
              className={classNames({ 'AnavisEditor-table': true, 'u-can-drop': canDrop })}
              dataSource={dataSource}
              expandedRowRender={this.renderExpandedRow}
              columns={this.columns}
              pagination={false}
              size="small"
              />
          )}
        </Dropperx>
      </div>
    );
  }
}

AnavisEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps,
  ...clientConfigProps
};

export default withTranslation('anavis')(inject({
  clientConfig: ClientConfig
}, AnavisEditor));
