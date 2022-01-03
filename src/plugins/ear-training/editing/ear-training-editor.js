import React from 'react';
import autoBind from 'auto-bind';
import { withTranslation } from 'react-i18next';
import { Form, Input, Table, Button, Radio } from 'antd';
import { SOUND_TYPE, TESTS_ORDER } from '../constants.js';
import EarTrainingSoundEditor from './ear-training-sound-editor.js';
import { swapItemsAt, removeItemAt } from '../../../utils/array-utils.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';
import { sectionEditorProps, translationProps } from '../../../ui/default-prop-types.js';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const ButtonGroup = Button.Group;

const defaultSound = { type: SOUND_TYPE.midi, url: null, text: null };

class EarTrainingEditor extends React.Component {
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
              disabled={index === this.props.content.tests.length - 1}
              icon={<ArrowDownOutlined />}
              onClick={this.handleDownCircleButtonClick}
              />
          </ButtonGroup>
        )
      }, {
        title: () => this.props.t('startAbcCode'),
        key: 'startAbcCode',
        render: (val, item, index) => (
          <TextArea
            data-index={index}
            value={item.startAbcCode}
            onChange={this.handleStartAbcCodeChanged}
            rows={6}
            />
        )
      }, {
        title: () => this.props.t('fullAbcCode'),
        key: 'fullAbcCode',
        render: (val, item, index) => (
          <TextArea
            data-index={index}
            value={item.fullAbcCode}
            onChange={this.handleFullAbcCodeChanged}
            rows={6}
            />
        )
      }, {
        title: (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={this.handleAddButtonClick}
            />
        ),
        width: 48,
        key: 'button',
        render: (value, item, index) => (
          <Button
            data-index={index}
            type="danger"
            icon={<DeleteOutlined />}
            disabled={this.props.content.tests.length < 2}
            onClick={this.handleDeletButtonClick}
            />
        )
      }
    ];

    this.expandedRowRender = (record, index) => (
      <EarTrainingSoundEditor
        testIndex={index}
        docKey={this.props.docKey}
        sound={record.sound || { ...defaultSound }}
        onSoundChanged={this.handleSoundChanged}
        />
    );
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  handleTitleChanged(event) {
    const { value } = event.target;
    this.changeContent({ title: value });
  }

  handleMaxWidthChanged(newValue) {
    this.changeContent({ maxWidth: newValue });
  }

  handleStartAbcCodeChanged(event) {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((test, i) => i === index ? { ...test, startAbcCode: value } : test);
    this.changeContent({ tests: newTests });
  }

  handleFullAbcCodeChanged(event) {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((test, i) => i === index ? { ...test, fullAbcCode: value } : test);
    this.changeContent({ tests: newTests });
  }

  handleSoundChanged({ testIndex, sound }) {
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((test, i) => i === testIndex ? { ...test, sound } : test);
    this.changeContent({ tests: newTests });
  }

  handleDeletButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = removeItemAt(oldTests, index);
    this.changeContent({ tests: newTests });
  }

  handleAddButtonClick() {
    const newTests = this.props.content.tests.slice();
    newTests.push({ startAbcCode: 'X:1', fullAbcCode: 'X:1' });
    this.changeContent({ tests: newTests });
  }

  handleUpCircleButtonClick(event) {
    const { dataset } = event.currentTarget;
    const index = Number.parseInt(dataset.index, 10);
    const newTests = swapItemsAt(this.props.content.tests, index, index - 1);
    this.changeContent({ tests: newTests });
  }

  handleDownCircleButtonClick(event) {
    const { dataset } = event.currentTarget;
    const index = Number.parseInt(dataset.index, 10);
    const newTests = swapItemsAt(this.props.content.tests, index, index + 1);
    this.changeContent({ tests: newTests });
  }

  handleTestsOrderChanged(event) {
    this.changeContent({ testsOrder: event.target.value });
  }

  render() {
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };
    const { content, t } = this.props;
    const dataSource = content.tests.map((test, i) => ({
      key: i,
      startAbcCode: test.startAbcCode,
      fullAbcCode: test.fullAbcCode,
      sound: test.sound
    }));

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label={t('title')} {...formItemLayout}>
            <Input value={content.title} onChange={this.handleTitleChanged} />
          </FormItem>
          <Form.Item label={t('maximumWidth')} {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={content.maxWidth} onChange={this.handleMaxWidthChanged} />
          </Form.Item>
          <FormItem label={t('testsOrder')} {...formItemLayout}>
            <RadioGroup value={content.testsOrder} onChange={this.handleTestsOrderChanged}>
              <RadioButton value={TESTS_ORDER.given}>{t('testsOrderGiven')}</RadioButton>
              <RadioButton value={TESTS_ORDER.random}>{t('testsOrderRandom')}</RadioButton>
            </RadioGroup>
          </FormItem>
        </Form>
        <Table
          dataSource={dataSource}
          columns={this.columns}
          expandable={{
            expandIconColumnIndex: -1,
            expandedRowClassName: () => 'EarTraining-expandedEditorRow',
            expandedRowRender: this.expandedRowRender,
            expandedRowKeys: dataSource.map(record => record.key)
          }}
          pagination={false}
          size="small"
          />
      </div>
    );
  }
}

EarTrainingEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps
};

export default withTranslation('earTraining')(EarTrainingEditor);
