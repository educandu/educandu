import React, { useRef } from 'react';
import { Form, Button, Radio } from 'antd';
import { TESTS_ORDER } from './constants.js';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../utils/unique-id.js';
import { PlusOutlined } from '@ant-design/icons';
import QuickTesterInfo from './quick-tester-info.js';
import ItemPanel from '../../components/item-panel.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import DragAndDropContainer from '../../components/drag-and-drop-container.js';
import { swapItemsAt, removeItemAt, moveItem } from '../../utils/array-utils.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function QuickTesterEditor({ content, onContentChanged }) {
  const { t } = useTranslation('quickTester');
  const droppableIdRef = useRef(uniqueId.create());
  const quickTesterInfo = useService(QuickTesterInfo);

  const { tests, testsOrder, teaser, title } = content;

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

  const handleInputQuestionChanged = (key, newValue) => {
    const newTests = tests.map(test => test.key === key ? { ...test, question: newValue } : test);
    changeContent({ tests: newTests });
  };

  const handleInputAnswerChanged = (key, newValue) => {
    const newTests = tests.map(test => test.key === key ? { ...test, answer: newValue } : test);
    changeContent({ tests: newTests });
  };

  const handleDeleteTest = index => {
    const newTests = removeItemAt(tests, index);
    changeContent({ tests: newTests });
  };

  const handleAddButtonClick = () => {
    const newTests = tests.slice();
    newTests.push(quickTesterInfo.getDefaultTest());
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

  const handleMoveTest = (fromIndex, toIndex) => {
    changeContent({ tests: moveItem(tests, fromIndex, toIndex) });
  };

  const handleTestsOrderChanged = event => {
    changeContent({ testsOrder: event.target.value });
  };

  const dragAndDropPanelItems = tests.map((test, index) => ({
    key: test.key,
    renderer: ({ dragHandleProps, isDragged, isOtherDragged }) => {
      return (
        <ItemPanel
          index={index}
          key={test.key}
          itemsCount={tests.length}
          isDragged={isDragged}
          isOtherDragged={isOtherDragged}
          dragHandleProps={dragHandleProps}
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
                debounced
                value={test.question}
                onChange={event => handleInputQuestionChanged(test.key, event.target.value)}
                />
            </div>
            <div>
              <span className="QuickTesterEditor-testContentLabel">{t('common:answer')}</span>
              <MarkdownInput
                preview
                debounced
                value={test.answer}
                onChange={event => handleInputAnswerChanged(test.key, event.target.value)}
                />
            </div>
          </div>
        </ItemPanel>
      );
    }
  }));

  return (
    <div className="QuickTesterEditor">
      <Form layout="horizontal" labelAlign="left">
        <FormItem label={`${t('teaser')}:`} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={teaser} onChange={handleTeaserValueChanged} />
        </FormItem>
        <FormItem label={`${t('common:title')}:`} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={title} onChange={handleTitleValueChanged} />
        </FormItem>
        <FormItem label={t('testsOrder')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={testsOrder} onChange={handleTestsOrderChanged}>
            <RadioButton value={TESTS_ORDER.given}>{t('testsOrderGiven')}</RadioButton>
            <RadioButton value={TESTS_ORDER.random}>{t('testsOrderRandom')}</RadioButton>
          </RadioGroup>
        </FormItem>
      </Form>
      <DragAndDropContainer droppableId={droppableIdRef.current} items={dragAndDropPanelItems} onItemMove={handleMoveTest} />
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
