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
import { sectionEditorProps, clientConfigProps, translationProps } from '../../../ui/default-prop-types.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;
const ButtonGroup = Button.Group;

const KIND_AUDIO = 'audio';
const KIND_VIDEO = 'video';

const TYPE_EXTERNAL = 'external';
const TYPE_INTERNAL = 'internal';
const TYPE_YOUTUBE = 'youtube';

const COLOR_SWATCHES = [
  ['#fffafa', '#ffd700', '#9ef083', '#7fff00', '#228b22', '#4582b4', '#ff0000', '#ca1515', '#800000', '#575757'],
  ['#e6f7ff', '#bae7ff', '#91d5ff', '#69c0ff', '#40a9ff', '#1890ff', '#096dd9', '#0050b3', '#003a8c', '#002766'],
  ['#f9f0ff', '#efdbff', '#d3adf7', '#b37feb', '#9254de', '#722ed1', '#531dab', '#391085', '#22075e', '#120338'],
  ['#e6fffb', '#b5f5ec', '#87e8de', '#5cdbd3', '#36cfc9', '#13c2c2', '#08979c', '#006d75', '#00474f', '#002329'],
  ['#f6ffed', '#d9f7be', '#b7eb8f', '#95de64', '#73d13d', '#52c41a', '#389e0d', '#237804', '#135200', '#092b00'],
  ['#fff0f6', '#ffd6e7', '#ffadd2', '#ff85c0', '#f759ab', '#eb2f96', '#c41d7f', '#9e1068', '#780650', '#520339'],
  ['#fff1f0', '#ffccc7', '#ffa39e', '#ff7875', '#ff4d4f', '#f5222d', '#cf1322', '#a8071a', '#820014', '#5c0011'],
  ['#fff7e6', '#ffe7ba', '#ffd591', '#ffc069', '#ffa940', '#fa8c16', '#d46b08', '#ad4e00', '#873800', '#612500'],
  ['#feffe6', '#ffffb8', '#fffb8f', '#fff566', '#ffec3d', '#fadb14', '#d4b106', '#ad8b00', '#876800', '#614700'],
  ['#fff2e8', '#ffd8bf', '#ffbb96', '#ff9c6e', '#ff7a45', '#fa541c', '#d4380d', '#ad2102', '#871400', '#610b00'],
  ['#f0f5ff', '#d6e4ff', '#adc6ff', '#85a5ff', '#597ef7', '#2f54eb', '#1d39c4', '#10239e', '#061178', '#030852'],
  ['#fcffe6', '#f4ffb8', '#eaff8f', '#d3f261', '#bae637', '#a0d911', '#7cb305', '#5b8c00', '#3f6600', '#254000'],
  ['#fffbe6', '#fff1b8', '#ffe58f', '#ffd666', '#ffc53d', '#faad14', '#d48806', '#ad6800', '#874d00', '#613400'],
  ['#ffffff', '#fafafa', '#f5f5f5', '#e8e8e8', '#d9d9d9', '#bfbfbf', '#8c8c8c', '#595959', '#262626', '#000000']
];

const DEFAULT_COLOR = '#4582b4';
const DEFAULT_LENGTH = 1000;

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

  handleInternalUrlValueChanged(value) {
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
        kind: showVideo ? KIND_VIDEO : KIND_AUDIO
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
    const { docKey, content, clientConfig, t } = this.props;
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
              <RadioButton value="external">{t('externalLink')}</RadioButton>
              <RadioButton value="internal">{t('elmuCdn')}</RadioButton>
              <RadioButton value="youtube">{t('youtube')}</RadioButton>
            </RadioGroup>
          </FormItem>
          {type === TYPE_EXTERNAL && (
            <FormItem label={t('externalUrl')} {...formItemLayout}>
              <Input value={url} onChange={this.handleExternalUrlValueChanged} />
            </FormItem>
          )}
          {type === TYPE_INTERNAL && (
            <FormItem label={t('internalUrl')} {...formItemLayout}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${clientConfig.cdnRootUrl}/`}
                  value={url}
                  readOnly
                  />
                <CdnFilePicker
                  rootPrefix="media"
                  uploadPrefix={`media/${docKey}`}
                  initialPrefix={`media/${docKey}`}
                  fileName={url}
                  onFileNameChanged={this.handleInternalUrlValueChanged}
                  />
              </div>
            </FormItem>
          )}
          {type === TYPE_YOUTUBE && (
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
            <Switch size="small" defaultChecked checked={kind === KIND_VIDEO} onChange={this.handleShowVideoChanged} />
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
