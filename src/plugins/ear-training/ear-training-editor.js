import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import EarTrainingInfo from './ear-training-info.js';
import ItemPanel from '../../components/item-panel.js';
import AbcNotation from '../../components/abc-notation.js';
import { Form, Input, Button, Radio, Divider } from 'antd';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import InputAndPreview from '../../components/input-and-preview.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { SOUND_SOURCE_TYPE, TESTS_ORDER, TEST_MODE } from './constants.js';
import { CDN_URL_PREFIX, IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import NeverScrollingTextArea from '../../components/never-scrolling-text-area.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const DEFAULT_ABC_CODE = 'X:1';
function EarTrainingEditor({ content, onContentChanged }) {
  const { t } = useTranslation('earTraining');
  const earTrainingInfo = useService(EarTrainingInfo);

  const { tests } = content;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const formItemLayoutVertical = {
    labelCol: { span: 24 },
    wrapperCol: { span: 24 }
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const hasInvalidSourceUrl = (newContent.tests || [])
      .some(test => (test.questionImage?.sourceType === IMAGE_SOURCE_TYPE.external && validation.validateUrl(test.questionImage.sourceUrl, t).validateStatus === 'error')
        || (test.answerImage?.sourceType === IMAGE_SOURCE_TYPE.external && validation.validateUrl(test.answerImage.sourceUrl, t).validateStatus === 'error')
        || (test.sound.sourceType === SOUND_SOURCE_TYPE.external && validation.validateUrl(test.sound.sourceUrl, t).validateStatus === 'error'));

    onContentChanged(newContent, hasInvalidSourceUrl);
  };

  const handleTitleChanged = event => {
    const { value } = event.target;
    changeContent({ title: value });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleQuestionAbcCodeChanged = (event, index) => {
    const { value } = event.target;
    const newTests = tests.map((test, i) => i === index ? { ...test, questionAbcCode: value } : test);
    changeContent({ tests: newTests });
  };

  const handleAnswerAbcCodeChanged = (event, index) => {
    const { value } = event.target;
    const newTests = tests.map((test, i) => i === index ? { ...test, answerAbcCode: value } : test);
    changeContent({ tests: newTests });
  };

  const handleDeleteTest = index => {
    const newTests = removeItemAt(tests, index);
    changeContent({ tests: newTests });
  };

  const handleAddButtonClick = () => {
    const newTests = cloneDeep(tests);
    newTests.push(earTrainingInfo.getDefaultTest());
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

    if (value === TEST_MODE.image) {
      newTests[index].questionImage = earTrainingInfo.getDefaultImage();
      newTests[index].answerImage = earTrainingInfo.getDefaultImage();
      newTests[index].questionAbcCode = '';
      newTests[index].answerAbcCode = '';
      newTests[index].sound = earTrainingInfo.getDefaultSound();
    } else {
      newTests[index].questionImage = null;
      newTests[index].answerImage = null;
      newTests[index].questionAbcCode = DEFAULT_ABC_CODE;
      newTests[index].answerAbcCode = DEFAULT_ABC_CODE;
      newTests[index].sound = { ...earTrainingInfo.getDefaultSound(), sourceType: SOUND_SOURCE_TYPE.midi };
    }

    newTests[index].mode = value;
    changeContent({ tests: newTests });
  };

  const handleQuestionImageSourceTypeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].questionImage.sourceType = value;
    newTests[index].questionImage.sourceUrl = '';
    changeContent({ tests: newTests });
  };

  const handleQuestionImageSourceUrlChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].questionImage.sourceUrl = value;
    changeContent({ tests: newTests });
  };

  const handleQuestionImageFileNameChange = (value, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].questionImage.sourceUrl = value;
    changeContent({ tests: newTests });
  };

  const handleQuestionImageCopyrightNoticeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].questionImage.copyrightNotice = value;
    changeContent({ tests: newTests });
  };

  const handleAnswerImageSourceTypeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].answerImage.sourceType = value;
    newTests[index].answerImage.sourceUrl = '';
    changeContent({ tests: newTests });
  };

  const handleAnswerImageSourceUrlChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].answerImage.sourceUrl = value;
    changeContent({ tests: newTests });
  };

  const handleAnswerImageFileNameChange = (value, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].answerImage.sourceUrl = value;
    changeContent({ tests: newTests });
  };

  const handleAnswerImageCopyrightNoticeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].answerImage.copyrightNotice = value;
    changeContent({ tests: newTests });
  };

  const handleSoundSourceTypeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);

    newTests[index].sound.sourceType = value;
    newTests[index].sound.sourceUrl = value === SOUND_SOURCE_TYPE.midi ? null : '';
    newTests[index].sound.copyrightNotice = value === SOUND_SOURCE_TYPE.midi ? null : newTests[index].sound.copyrightNotice || '';

    changeContent({ tests: newTests });
  };

  const handleSoundSourceUrlChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].sound.sourceUrl = value;
    changeContent({ tests: newTests });
  };

  const handleSoundFileNameChange = (value, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].sound.sourceUrl = value;
    changeContent({ tests: newTests });
  };

  const handleSoundCopyrightNoticeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].sound.copyrightNotice = value;
    changeContent({ tests: newTests });
  };

  const renderExternalSourceUrlInput = (index, value, handleSourceUrlChange) => {
    return (
      <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(value, t)} hasFeedback>
        <Input value={value} onChange={event => handleSourceUrlChange(event, index)} />
      </FormItem>
    );
  };

  const renderInternalSourceUrlInput = (index, value, handleSourceUrlChange, handleSourceUrlFileNameChange) => {
    return (
      <FormItem label={t('common:internalUrl')} {...formItemLayout}>
        <div className="u-input-and-button">
          <Input
            addonBefore={CDN_URL_PREFIX}
            value={value}
            onChange={event => handleSourceUrlChange(event, index)}
            />
          <ResourcePicker
            url={storageLocationPathToUrl(value)}
            onUrlChange={url => handleSourceUrlFileNameChange(urlToStorageLocationPath(url), index)}
            />
        </div>
      </FormItem>
    );
  };

  const renderCopyrightNoticeInput = (index, value, handleValueChange) => {
    return (
      <Form.Item label={t('common:copyrightNotice')} {...formItemLayout}>
        <MarkdownInput value={value} onChange={event => handleValueChange(event, index)} />
      </Form.Item>
    );
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
              <Fragment>
                <Divider plain>{t('testQuestion')}</Divider>
                <FormItem label={t('common:source')} {...formItemLayout}>
                  <RadioGroup value={test.questionImage.sourceType} onChange={event => handleQuestionImageSourceTypeChange(event, index)}>
                    <RadioButton value={IMAGE_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
                    <RadioButton value={IMAGE_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
                  </RadioGroup>
                </FormItem>
                {test.questionImage.sourceType === IMAGE_SOURCE_TYPE.external
                  && renderExternalSourceUrlInput(index, test.questionImage.sourceUrl, handleQuestionImageSourceUrlChange)}
                {test.questionImage.sourceType === IMAGE_SOURCE_TYPE.internal
                  && renderInternalSourceUrlInput(index, test.questionImage.sourceUrl, handleQuestionImageSourceUrlChange, handleQuestionImageFileNameChange)}
                {renderCopyrightNoticeInput(index, test.questionImage.copyrightNotice, handleQuestionImageCopyrightNoticeChange)}

                <Divider plain>{t('testAnswer')}</Divider>

                <FormItem label={t('common:source')} {...formItemLayout}>
                  <RadioGroup value={test.answerImage.sourceType} onChange={event => handleAnswerImageSourceTypeChange(event, index)}>
                    <RadioButton value={IMAGE_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
                    <RadioButton value={IMAGE_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
                  </RadioGroup>
                </FormItem>
                {test.answerImage.sourceType === IMAGE_SOURCE_TYPE.external
                  && renderExternalSourceUrlInput(index, test.answerImage.sourceUrl, handleAnswerImageSourceUrlChange)}
                {test.answerImage.sourceType === IMAGE_SOURCE_TYPE.internal
                  && renderInternalSourceUrlInput(index, test.answerImage.sourceUrl, handleAnswerImageSourceUrlChange, handleAnswerImageFileNameChange)}
                {renderCopyrightNoticeInput(index, test.answerImage.copyrightNotice, handleAnswerImageCopyrightNoticeChange)}

              </Fragment>
            )}

            {test.mode === TEST_MODE.abcCode && (
              <Fragment>
                <Divider plain>{t('testQuestion')}</Divider>
                <Form.Item label={t('abcCode')} {...formItemLayoutVertical}>
                  <InputAndPreview
                    input={<NeverScrollingTextArea minRows={6} value={test.questionAbcCode} onChange={event => handleQuestionAbcCodeChanged(event, index)} />}
                    preview={<AbcNotation abcCode={test.questionAbcCode} />}
                    />
                </Form.Item>
                <Divider plain>{t('testAnswer')}</Divider>
                <Form.Item label={t('abcCode')} {...formItemLayoutVertical}>
                  <InputAndPreview
                    input={<NeverScrollingTextArea minRows={6} value={test.answerAbcCode} onChange={event => handleAnswerAbcCodeChanged(event, index)} />}
                    preview={<AbcNotation abcCode={test.answerAbcCode} />}
                    />
                </Form.Item>
              </Fragment>
            )}

            <Divider plain>{t('audio')}</Divider>

            <FormItem label={t('common:source')} {...formItemLayout}>
              <RadioGroup value={test.sound.sourceType} onChange={event => handleSoundSourceTypeChange(event, index)}>
                {test.mode === TEST_MODE.abcCode && (
                <RadioButton value={SOUND_SOURCE_TYPE.midi}>{t('midi')}</RadioButton>
                )}
                <RadioButton value={SOUND_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
                <RadioButton value={SOUND_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
              </RadioGroup>
            </FormItem>
            {test.sound.sourceType === SOUND_SOURCE_TYPE.external
              && renderExternalSourceUrlInput(index, test.sound.sourceUrl, handleSoundSourceUrlChange)}
            {test.sound.sourceType === SOUND_SOURCE_TYPE.internal
                && renderInternalSourceUrlInput(index, test.sound.sourceUrl, handleSoundSourceUrlChange, handleSoundFileNameChange)}
            {test.sound.sourceType !== SOUND_SOURCE_TYPE.midi
              && renderCopyrightNoticeInput(index, test.sound.copyrightNotice, handleSoundCopyrightNoticeChange)}
          </ItemPanel>
        ))}
      </Form>

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
