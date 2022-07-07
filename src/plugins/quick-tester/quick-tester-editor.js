import React from 'react';
import { TESTS_ORDER } from './constants.js';
import { useTranslation } from 'react-i18next';
import ItemPanel from '../../components/item-panel.js';
import { Form, Button, Radio, Checkbox, Tooltip } from 'antd';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function QuickTesterEditor({ content, onContentChanged }) {
  const { t } = useTranslation('quickTester');

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };
  const { tests, testsOrder, teaser, title } = content;

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

  const handleDeleteTest = index => {
    const newTests = removeItemAt(tests, index);
    changeContent({ tests: newTests });
  };

  const handleAddButtonClick = () => {
    const newTests = tests.slice();
    newTests.push({ question: `[${t('common:question')}]`, answer: `[${t('common:answer')}]` });
    changeContent({ tests: newTests });
  };

  const handleMoveTestUp = index => {
    const newTests = swapItemsAt(tests, index, index - 1);
    changeContent({ tests: newTests });
  };

  const handleMoveTestDown = index => {
    const newTests = swapItemsAt(tests, index, index + 1);
    changeContent({ tests: newTests });
  };

  const handleTestsOrderChanged = event => {
    changeContent({ testsOrder: event.target.value });
  };

  const handleRenderMediaChanged = event => {
    changeContent({ renderMedia: event.target.checked });
  };

  return (
    <div className="QuickTesterEditor">
      <Form layout="horizontal">
        <FormItem label={`${t('teaserLabel')}:`} {...formItemLayout}>
          <MarkdownInput inline value={teaser} onChange={handleTeaserValueChanged} />
        </FormItem>
        <FormItem label={`${t('common:title')}:`} {...formItemLayout}>
          <MarkdownInput inline value={title} onChange={handleTitleValueChanged} />
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
      {tests.map((test, index) => (
        <ItemPanel
          index={index}
          key={index.toString()}
          itemsCount={tests.length}
          header={t('testNumber', { number: index + 1 })}
          onMoveUp={handleMoveTestUp}
          onMoveDown={handleMoveTestDown}
          onDelete={handleDeleteTest}
          >
          <div className="QuickTesterEditor-testContent">
            <div>
              <span className="QuickTesterEditor-testContentLabel">{t('common:question')}</span>
              <MarkdownInput
                preview
                renderMedia={content.renderMedia}
                value={test.question}
                onChange={event => handleInputQuestionChanged(index, event.target.value)}
                />
            </div>
            <div>
              <span className="QuickTesterEditor-testContentLabel">{t('common:answer')}</span>
              <MarkdownInput
                preview
                renderMedia={content.renderMedia}
                value={test.answer}
                onChange={event => handleInputAnswerChanged(index, event.target.value)}
                />
            </div>
          </div>
        </ItemPanel>
      ))}
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddButtonClick}>
        {t('addTest')}
      </Button>
    </div>
  );
}

QuickTesterEditor.propTypes = {
  ...sectionEditorProps
};

export default QuickTesterEditor;
