import React from 'react';
import autoBind from 'auto-bind';
import { TESTS_ORDER } from '../constants.js';
import { withTranslation } from 'react-i18next';
import { Form, Input, Table, Button, Radio } from 'antd';
import { swapItemsAt, removeItemAt } from '../../../utils/array-utils.js';
import { sectionEditorProps, translationProps } from '../../../ui/default-prop-types.js';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const ButtonGroup = Button.Group;

class QuickTesterEditor extends React.Component {
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
        title: () => this.props.t('question'),
        dataIndex: 'question',
        key: 'question',
        render: (question, item, index) => (
          <Input
            value={question}
            onChange={event => this.handleInputQuestionChanged(index, event.target.value)}
            />
        )
      }, {
        title: () => this.props.t('answer'),
        dataIndex: 'answer',
        key: 'answer',
        render: (answer, item, index) => (
          <Input
            value={answer}
            onChange={event => this.handleInputAnswerChanged(index, event.target.value)}
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
            disabled={this.props.content.tests.length < 2}
            type="danger"
            icon={<DeleteOutlined />}
            onClick={() => this.handleDeleteButtonClick(index)}
            />
        )
      }
    ];
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  handleTeaserValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ teaser: value });
  }

  handleTitleValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ title: value });
  }

  handleInputQuestionChanged(index, newValue) {
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((t, i) => i === index ? { question: newValue, answer: t.answer } : t);
    this.changeContent({ tests: newTests });
  }

  handleInputAnswerChanged(index, newValue) {
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((t, i) => i === index ? { question: t.question, answer: newValue } : t);
    this.changeContent({ tests: newTests });
  }

  handleDeleteButtonClick(index) {
    const oldTests = this.props.content.tests;
    const newTests = removeItemAt(oldTests, index);
    this.changeContent({ tests: newTests });
  }

  handleAddButtonClick() {
    const { content, t } = this.props;
    const newTests = content.tests.slice();
    newTests.push({ question: `[${t('quickTester:question')}]`, answer: `[${t('quickTester:answer')}]` });
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

  render() {
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };
    const { content, t } = this.props;
    const dataSource = content.tests.map((test, i) => ({ key: i, ...test }));

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label={`${t('teaserLabel')}:`} {...formItemLayout}>
            <Input value={content.teaser} onChange={this.handleTeaserValueChanged} />
          </FormItem>
          <FormItem label={`${t('titleLabel')}:`} {...formItemLayout}>
            <Input value={content.title} onChange={this.handleTitleValueChanged} />
          </FormItem>
          <FormItem label={t('testsOrder')} {...formItemLayout}>
            <RadioGroup value={content.testsOrder} onChange={this.handleTestsOrderChanged}>
              <RadioButton value={TESTS_ORDER.given}>{t('testsOrderGiven')}</RadioButton>
              <RadioButton value={TESTS_ORDER.random}>{t('testsOrderRandom')}</RadioButton>
            </RadioGroup>
          </FormItem>
        </Form>
        <Table dataSource={dataSource} columns={this.columns} pagination={false} size="small" />
      </div>
    );
  }
}

QuickTesterEditor.propTypes = {
  ...sectionEditorProps,
  ...translationProps
};

export default withTranslation('quickTester')(QuickTesterEditor);
