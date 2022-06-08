import React from 'react';
import { TESTS_ORDER } from './constants.js';
import { useTranslation } from 'react-i18next';
import DeleteButton from '../../components/delete-button.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import MoveUpIcon from '../../components/icons/general/move-up-icon.js';
import MoveDownIcon from '../../components/icons/general/move-down-icon.js';
import { Form, Input, Table, Button, Radio, Checkbox, Tooltip } from 'antd';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const ButtonGroup = Button.Group;
const TextArea = Input.TextArea;

function QuickTesterEditor({ content, onContentChanged }) {
  const { t } = useTranslation('quickTester');

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };
  const { tests, testsOrder, teaser, title } = content;
  const dataSource = tests.map((test, i) => ({ key: i, ...test }));

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
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
    newTests.push({ question: `[${t('common:question')}]`, answer: `[${t('common:answer')}]` });
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

  const handleRenderMediaChanged = event => {
    changeContent({ renderMedia: event.target.checked });
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
            disabled={index === tests.length - 1}
            icon={<MoveDownIcon />}
            onClick={() => handleDownCircleButtonClick(index)}
            />
        </ButtonGroup>
      )
    }, {
      title: () => t('common:question'),
      dataIndex: 'question',
      key: 'question',
      render: (question, item, index) => (
        <TextArea
          rows={3}
          value={question}
          onChange={event => handleInputQuestionChanged(index, event.target.value)}
          />
      )
    }, {
      title: () => t('common:answer'),
      dataIndex: 'answer',
      key: 'answer',
      render: (answer, item, index) => (
        <TextArea
          rows={3}
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
        <DeleteButton onClick={() => handleDeleteButtonClick(index)} disabled={tests.length < 2} />
      )
    }
  ];

  return (
    <div className="QuickTesterEditor">
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
        <Form.Item label={t('common:renderMedia')} {...formItemLayout}>
          <Checkbox checked={content.renderMedia} onChange={handleRenderMediaChanged} />
          <Tooltip title={t('renderMediaInfo')}>
            <InfoCircleOutlined className="QuickTesterEditor-infoIcon" />
          </Tooltip>
        </Form.Item>
      </Form>
      <Table dataSource={dataSource} columns={columns} pagination={false} size="small" />
    </div>
  );
}

QuickTesterEditor.propTypes = {
  ...sectionEditorProps
};

export default QuickTesterEditor;
