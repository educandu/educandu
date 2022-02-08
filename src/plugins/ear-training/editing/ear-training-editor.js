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
              disabled={index === 0}
              icon={<ArrowUpOutlined />}
              onClick={() => this.handleUpCircleButtonClick(index)}
              />
            <Button
              disabled={index === this.props.content.tests.length - 1}
              icon={<ArrowDownOutlined />}
              onClick={() => this.handleDownCircleButtonClick(index)}
              />
          </ButtonGroup>
        )
      }, {
        title: () => this.props.t('startAbcCode'),
        key: 'startAbcCode',
        render: (val, item, index) => (
          <TextArea
            value={item.startAbcCode}
            onChange={event => this.handleStartAbcCodeChanged(index, event.target.value)}
            rows={6}
            />
        )
      }, {
        title: () => this.props.t('fullAbcCode'),
        key: 'fullAbcCode',
        render: (val, item, index) => (
          <TextArea
            value={item.fullAbcCode}
            onChange={event => this.handleFullAbcCodeChanged(index, event.target.value)}
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
            type="danger"
            icon={<DeleteOutlined />}
            disabled={this.props.content.tests.length < 2}
            onClick={() => this.handleDeleteButtonClick(index)}
            />
        )
      }
    ];

    this.renderExpandedRow = (record, index) => (
      <EarTrainingSoundEditor
        sectionContainerId={this.props.sectionContainerId}
        sound={record.sound || { ...defaultSound }}
        onSoundChanged={newValue => this.handleSoundChanged(index, newValue)}
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

  handleStartAbcCodeChanged(index, newValue) {
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((test, i) => i === index ? { ...test, startAbcCode: newValue } : test);
    this.changeContent({ tests: newTests });
  }

  handleFullAbcCodeChanged(index, newValue) {
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((test, i) => i === index ? { ...test, fullAbcCode: newValue } : test);
    this.changeContent({ tests: newTests });
  }

  handleSoundChanged(index, newValue) {
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((test, i) => i === index ? { ...test, sound: newValue } : test);
    this.changeContent({ tests: newTests });
  }

  handleDeleteButtonClick(index) {
    const oldTests = this.props.content.tests;
    const newTests = removeItemAt(oldTests, index);
    this.changeContent({ tests: newTests });
  }

  handleAddButtonClick() {
    const newTests = this.props.content.tests.slice();
    newTests.push({ startAbcCode: 'X:1', fullAbcCode: 'X:1' });
    this.changeContent({ tests: newTests });
  }

  handleUpCircleButtonClick(index) {
    const newTests = swapItemsAt(this.props.content.tests, index, index - 1);
    this.changeContent({ tests: newTests });
  }

  handleDownCircleButtonClick(index) {
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
    const dataSource = content.tests.map((test, i) => ({ key: i, ...test }));
    const expandedRowKeys = dataSource.map(record => record.key);

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label={t('common:title')} {...formItemLayout}>
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
            expandedRowRender: this.renderExpandedRow,
            expandedRowKeys
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
