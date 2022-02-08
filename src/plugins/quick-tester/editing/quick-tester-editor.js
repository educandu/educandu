import React from 'react';
import { TESTS_ORDER } from '../constants.js';
import { useTranslation } from 'react-i18next';
import { Form, Input, Table, Button, Radio } from 'antd';
import { sectionEditorProps } from '../../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../../utils/array-utils.js';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const ButtonGroup = Button.Group;

function QuickTesterEditor({ content, onContentChanged }) {
  const { t } = useTranslation('quickTester');

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };
  const { tests, testsOrder, teaser, title } = content;
  const dataSource = tests.map((test, i) => ({ key: i, ...test }));

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleTeaserValueChanged = event => {
    const { value } = event.target;
    changeContent({ teaser: value });
  };

  const handleTitleValueChanged = event => {
    const { value } = event.target;
    changeContent({ title: value });
  };

  const handleInputQuestionChanged = (index, newValue) => {
    const newTests = tests.map((test, i) => i === index ? { question: newValue, answer: test.answer } : test);
    changeContent({ tests: newTests });
  };

  const handleInputAnswerChanged = (index, newValue) => {
    const newTests = tests.map((test, i) => i === index ? { question: test.question, answer: newValue } : test);
    changeContent({ tests: newTests });
  };

  const handleDeleteButtonClick = index => {
    const newTests = removeItemAt(tests, index);
    changeContent({ tests: newTests });
  };

  const handleAddButtonClick = () => {
    const newTests = tests.slice();
    newTests.push({ question: `[${t('quickTester:question')}]`, answer: `[${t('quickTester:answer')}]` });
    changeContent({ tests: newTests });
  };

  const handleUpCircleButtonClick = index => {
    const newTests = swapItemsAt(tests, index, index - 1);
    changeContent({ tests: newTests });
  };

  const handleDownCircleButtonClick = index => {
    const newTests = swapItemsAt(tests, index, index + 1);
    changeContent({ tests: newTests });
  };

  const handleTestsOrderChanged = event => {
    changeContent({ testsOrder: event.target.value });
  };

  const columns = [
    {
      width: 80,
      key: 'upDown',
      render: (upDown, item, index) => (
        <ButtonGroup>
          <Button
            disabled={index === 0}
            icon={<ArrowUpOutlined />}
            onClick={() => handleUpCircleButtonClick(index)}
            />
          <Button
            disabled={index === tests.length - 1}
            icon={<ArrowDownOutlined />}
            onClick={() => handleDownCircleButtonClick(index)}
            />
        </ButtonGroup>
      )
    }, {
      title: () => t('question'),
      dataIndex: 'question',
      key: 'question',
      render: (question, item, index) => (
        <Input
          value={question}
          onChange={event => handleInputQuestionChanged(index, event.target.value)}
          />
      )
    }, {
      title: () => t('answer'),
      dataIndex: 'answer',
      key: 'answer',
      render: (answer, item, index) => (
        <Input
          value={answer}
          onChange={event => handleInputAnswerChanged(index, event.target.value)}
          />
      )
    }, {
      title: (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddButtonClick}
          />
      ),
      width: 48,
      key: 'button',
      render: (value, item, index) => (
        <Button
          disabled={tests.length < 2}
          type="danger"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteButtonClick(index)}
          />
      )
    }
  ];

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={`${t('teaserLabel')}:`} {...formItemLayout}>
          <Input value={teaser} onChange={handleTeaserValueChanged} />
        </FormItem>
        <FormItem label={`${t('common:title')}:`} {...formItemLayout}>
          <Input value={title} onChange={handleTitleValueChanged} />
        </FormItem>
        <FormItem label={t('testsOrder')} {...formItemLayout}>
          <RadioGroup value={testsOrder} onChange={handleTestsOrderChanged}>
            <RadioButton value={TESTS_ORDER.given}>{t('testsOrderGiven')}</RadioButton>
            <RadioButton value={TESTS_ORDER.random}>{t('testsOrderRandom')}</RadioButton>
          </RadioGroup>
        </FormItem>
      </Form>
      <Table dataSource={dataSource} columns={columns} pagination={false} size="small" />
    </div>
  );
}

QuickTesterEditor.propTypes = {
  ...sectionEditorProps
};

export default QuickTesterEditor;
