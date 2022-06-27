import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import { Form, Input, Button, Radio } from 'antd';
import cloneDeep from '../../utils/clone-deep.js';
import ItemPanel from '../../components/item-panel.js';
import MarkdownInput from '../../components/markdown-input.js';
import EarTrainingSoundEditor from './ear-training-sound-editor.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { SOUND_SOURCE_TYPE, TESTS_ORDER, TEST_MODE } from './constants.js';

const { TextArea } = Input;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const defaultSound = { sourceType: SOUND_SOURCE_TYPE.midi, sourceUrl: null, text: null };

function EarTrainingEditor({ content, onContentChanged }) {
  const { t } = useTranslation('earTraining');

  const { tests } = content;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleTitleChanged = event => {
    const { value } = event.target;
    changeContent({ title: value });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleStartAbcCodeChanged = (index, newValue) => {
    const newTests = tests.map((test, i) => i === index ? { ...test, startAbcCode: newValue } : test);
    changeContent({ tests: newTests });
  };

  const handleFullAbcCodeChanged = (index, newValue) => {
    const newTests = tests.map((test, i) => i === index ? { ...test, fullAbcCode: newValue } : test);
    changeContent({ tests: newTests });
  };

  const handleSoundChanged = (index, newValue) => {
    const newTests = tests.map((test, i) => i === index ? { ...test, sound: newValue } : test);
    changeContent({ tests: newTests });
  };

  const handleDeleteTest = index => {
    const newTests = removeItemAt(tests, index);
    changeContent({ tests: newTests });
  };

  const handleAddButtonClick = () => {
    const newTests = tests.slice();
    newTests.push({ startAbcCode: 'X:1', fullAbcCode: 'X:1' });
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

  const handleTestsOrderChange = event => {
    changeContent({ testsOrder: event.target.value });
  };

  const handleTestModeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].mode = value;
    changeContent({ tests: newTests });
  };

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('common:title')} {...formItemLayout}>
          <MarkdownInput inline value={content.title} onChange={handleTitleChanged} />
        </FormItem>
        <Form.Item label={t('common:width')} {...formItemLayout}>
          <ObjectWidthSlider value={content.width} onChange={handleWidthChanged} />
        </Form.Item>
        <FormItem label={t('testsOrder')} {...formItemLayout}>
          <RadioGroup value={content.testsOrder} onChange={handleTestsOrderChange}>
            <RadioButton value={TESTS_ORDER.given}>{t('testsOrderGiven')}</RadioButton>
            <RadioButton value={TESTS_ORDER.random}>{t('testsOrderRandom')}</RadioButton>
          </RadioGroup>
        </FormItem>
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
          <FormItem label={t('testMode')} {...formItemLayout}>
            <RadioGroup value={test.mode} onChange={event => handleTestModeChange(event, index)}>
              <RadioButton value={TEST_MODE.image}>{t('testModeImage')}</RadioButton>
              <RadioButton value={TEST_MODE.abcCode}>{t('testModeAbcCode')}</RadioButton>
            </RadioGroup>
          </FormItem>
          {test.mode === TEST_MODE.image && (
            <span>image here</span>
          )}
          {test.mode === TEST_MODE.abcCode && (
            <Fragment>
              <FormItem label={t('startAbcCode')} {...formItemLayout}>
                <TextArea
                  value={test.startAbcCode}
                  onChange={event => handleStartAbcCodeChanged(index, event.target.value)}
                  rows={6}
                  />
              </FormItem>
              <FormItem label={t('fullAbcCode')} {...formItemLayout}>
                <TextArea
                  value={test.fullAbcCode}
                  onChange={event => handleFullAbcCodeChanged(index, event.target.value)}
                  rows={6}
                  />
              </FormItem>
              <EarTrainingSoundEditor
                sound={test.sound || { ...defaultSound }}
                onSoundChanged={newValue => handleSoundChanged(index, newValue)}
                />
            </Fragment>
          )}
        </ItemPanel>
      ))}
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddButtonClick}>
        {t('addTest')}
      </Button>
    </div>
  );
}

EarTrainingEditor.propTypes = {
  ...sectionEditorProps
};

export default EarTrainingEditor;
