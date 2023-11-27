import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import { Form, Button, Radio, Divider } from 'antd';
import EarTrainingInfo from './ear-training-info.js';
import UrlInput from '../../components/url-input.js';
import ItemPanel from '../../components/item-panel.js';
import React, { Fragment, useId, useRef } from 'react';
import AbcNotation from '../../components/abc-notation.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import InputAndPreview from '../../components/input-and-preview.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { SOUND_MODE, TESTS_ORDER, TEST_MODE } from './constants.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import DragAndDropContainer from '../../components/drag-and-drop-container.js';
import { createCopyrightForSourceMetadata } from '../../utils/source-utils.js';
import NeverScrollingTextArea from '../../components/never-scrolling-text-area.js';
import MediaVolumeSlider from '../../components/media-player/media-volume-slider.js';
import MediaRangeSelector from '../../components/media-player/media-range-selector.js';
import MediaRangeReadonlyInput from '../../components/media-player/media-range-readonly-input.js';
import { swapItemsAt, removeItemAt, ensureIsExcluded, moveItem } from '../../utils/array-utils.js';
import { FORM_ITEM_LAYOUT, FORM_ITEM_LAYOUT_VERTICAL, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function EarTrainingEditor({ content, onContentChanged }) {
  const droppableIdRef = useRef(useId());
  const { t } = useTranslation('earTraining');
  const earTrainingInfo = useService(EarTrainingInfo);

  const { tests } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
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

  const handleMoveTest = (fromIndex, toIndex) => {
    changeContent({ tests: moveItem(tests, fromIndex, toIndex) });
  };

  const handleTestsOrderChange = event => {
    changeContent({ testsOrder: event.target.value });
  };

  const handleTestModeChange = (event, index) => {
    const { value } = event.target;

    const oldTest = tests[index];
    const newTest = {
      ...earTrainingInfo.getDefaultTest(),
      key: oldTest.key,
      testMode: value,
      soundMode: oldTest.soundMode,
      sourceSound: cloneDeep(oldTest.sourceSound),
      abcMidiSound: cloneDeep(oldTest.abcMidiSound)
    };

    if (newTest.testMode !== TEST_MODE.abcCode && newTest.soundMode === SOUND_MODE.abcMidi) {
      newTest.soundMode = SOUND_MODE.source;
      newTest.sourceSound = earTrainingInfo.getDefaultSourceSound();
      newTest.abcMidiSound = earTrainingInfo.getDefaultAbcMidiSound();
    }

    const newTests = cloneDeep(tests);
    newTests[index] = newTest;
    changeContent({ tests: newTests });
  };

  const handleSoundModeChange = (event, index) => {
    const { value } = event.target;

    const oldTest = tests[index];
    const newTest = cloneDeep(oldTest);

    switch (value) {
      case SOUND_MODE.abcMidi:
        newTest.soundMode = SOUND_MODE.abcMidi;
        newTest.sourceSound = earTrainingInfo.getDefaultSourceSound();
        newTest.abcMidiSound = { ...earTrainingInfo.getDefaultAbcMidiSound(), initialVolume: oldTest.sourceSound.initialVolume };
        break;
      case SOUND_MODE.source:
        newTest.soundMode = SOUND_MODE.source;
        newTest.sourceSound = { ...earTrainingInfo.getDefaultSourceSound(), initialVolume: oldTest.abcMidiSound.initialVolume };
        newTest.abcMidiSound = earTrainingInfo.getDefaultAbcMidiSound();
        break;
      default:
        throw new Error(`Invalid sound mode '${value}'`);
    }

    const newTests = cloneDeep(tests);
    newTests[index] = newTest;
    changeContent({ tests: newTests });
  };

  const handleQuestionImageSourceUrlChange = (value, metadata, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].questionImage.sourceUrl = value;
    newTests[index].questionImage.copyrightNotice = createCopyrightForSourceMetadata(metadata, t);
    changeContent({ tests: newTests });
  };

  const handleQuestionImageCopyrightNoticeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].questionImage.copyrightNotice = value;
    changeContent({ tests: newTests });
  };

  const handleAnswerImageSourceUrlChange = (value, metadata, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].answerImage.sourceUrl = value;
    newTests[index].answerImage.copyrightNotice = createCopyrightForSourceMetadata(metadata, t);
    changeContent({ tests: newTests });
  };

  const handleAnswerImageCopyrightNoticeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].answerImage.copyrightNotice = value;
    changeContent({ tests: newTests });
  };

  const handleSourceSoundSourceUrlChange = (value, metadata, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].sourceSound.sourceUrl = value;
    newTests[index].sourceSound.copyrightNotice = createCopyrightForSourceMetadata(metadata, t);
    changeContent({ tests: newTests });
  };

  const handleSourceSoundPlaybackRangeChange = (value, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].sourceSound.playbackRange = value;
    changeContent({ tests: newTests });
  };

  const handleSourceSoundCopyrightNoticeChange = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].sourceSound.copyrightNotice = value;
    changeContent({ tests: newTests });
  };

  const handleSourceSoundInitialVolumeChange = (value, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].sourceSound.initialVolume = value;
    changeContent({ tests: newTests });
  };

  const handleAbcMidiSoundInitialVolumeChange = (value, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].abcMidiSound.initialVolume = value;
    changeContent({ tests: newTests });
  };

  const renderCopyrightNoticeInput = (index, value, handleValueChange) => {
    return (
      <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
        <MarkdownInput debounced value={value} onChange={event => handleValueChange(event, index)} />
      </FormItem>
    );
  };

  const renderTestItemPanel = ({ test, index, dragHandleProps, isDragged, isOtherDragged }) => {
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
        <FormItem label={t('testMode')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={test.testMode} onChange={event => handleTestModeChange(event, index)}>
            <RadioButton value={TEST_MODE.image}>{t('testModeImage')}</RadioButton>
            <RadioButton value={TEST_MODE.abcCode}>{t('testModeAbcCode')}</RadioButton>
          </RadioGroup>
        </FormItem>

        {test.testMode === TEST_MODE.image && (
          <Fragment>
            <Divider plain>{t('testQuestion')}</Divider>
            <FormItem label={t('common:url')} {...FORM_ITEM_LAYOUT}>
              <UrlInput
                value={test.questionImage.sourceUrl}
                onChange={(value, metadata) => handleQuestionImageSourceUrlChange(value, metadata, index)}
                allowedSourceTypes={ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube)}
                />
            </FormItem>
            {renderCopyrightNoticeInput(index, test.questionImage.copyrightNotice, handleQuestionImageCopyrightNoticeChange)}

            <Divider plain>{t('testAnswer')}</Divider>
            <FormItem label={t('common:url')} {...FORM_ITEM_LAYOUT}>
              <UrlInput
                value={test.answerImage.sourceUrl}
                onChange={(value, metadata) => handleAnswerImageSourceUrlChange(value, metadata, index)}
                allowedSourceTypes={ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube)}
                />
            </FormItem>
            {renderCopyrightNoticeInput(index, test.answerImage.copyrightNotice, handleAnswerImageCopyrightNoticeChange)}
          </Fragment>
        )}

        {test.testMode === TEST_MODE.abcCode && (
          <Fragment>
            <Divider plain>{t('testQuestion')}</Divider>
            <FormItem label={t('abcCode')} {...FORM_ITEM_LAYOUT_VERTICAL}>
              <InputAndPreview
                input={
                  <NeverScrollingTextArea
                    debounced
                    minRows={6}
                    value={test.questionAbcCode}
                    onChange={event => handleQuestionAbcCodeChanged(event, index)}
                    />
                }
                preview={<AbcNotation abcCode={test.questionAbcCode} />}
                />
            </FormItem>
            <Divider plain>{t('testAnswer')}</Divider>
            <FormItem label={t('abcCode')} {...FORM_ITEM_LAYOUT_VERTICAL}>
              <InputAndPreview
                input={
                  <NeverScrollingTextArea
                    debounced
                    minRows={6}
                    value={test.answerAbcCode}
                    onChange={event => handleAnswerAbcCodeChanged(event, index)}
                    />
                }
                preview={<AbcNotation abcCode={test.answerAbcCode} />}
                />
            </FormItem>
          </Fragment>
        )}

        <Divider plain>{t('audio')}</Divider>

        <FormItem label={t('soundMode')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={test.soundMode} onChange={event => handleSoundModeChange(event, index)}>
            <RadioButton value={SOUND_MODE.source}>{t('soundModeSource')}</RadioButton>
            <RadioButton value={SOUND_MODE.abcMidi} disabled={test.testMode !== TEST_MODE.abcCode}>{t('soundModeAbcMidi')}</RadioButton>
          </RadioGroup>
        </FormItem>

        {test.soundMode === SOUND_MODE.source && (
          <Fragment>
            <FormItem label={t('common:url')} {...FORM_ITEM_LAYOUT}>
              <UrlInput value={test.sourceSound.sourceUrl} onChange={(value, metadata) => handleSourceSoundSourceUrlChange(value, metadata, index)} />
            </FormItem>
            <FormItem label={t('common:playbackRange')} {...FORM_ITEM_LAYOUT}>
              <div className="u-input-and-button">
                <MediaRangeReadonlyInput sourceUrl={test.sourceSound.sourceUrl} playbackRange={test.sourceSound.playbackRange} />
                <MediaRangeSelector sourceUrl={test.sourceSound.sourceUrl} range={test.sourceSound.playbackRange} onRangeChange={value => handleSourceSoundPlaybackRangeChange(value, index)} />
              </div>
            </FormItem>
            {renderCopyrightNoticeInput(index, test.sourceSound.copyrightNotice, handleSourceSoundCopyrightNoticeChange)}
            <FormItem label={t('common:initialVolume')} {...FORM_ITEM_LAYOUT} >
              <MediaVolumeSlider
                value={test.sourceSound.initialVolume}
                useValueLabel
                useButton={false}
                onChange={value => handleSourceSoundInitialVolumeChange(value, index)}
                />
            </FormItem>
          </Fragment>
        )}

        {test.soundMode === SOUND_MODE.abcMidi && (
          <FormItem label={t('common:initialVolume')} {...FORM_ITEM_LAYOUT} >
            <MediaVolumeSlider
              value={test.abcMidiSound.initialVolume}
              useValueLabel
              useButton={false}
              onChange={value => handleAbcMidiSoundInitialVolumeChange(value, index)}
              />
          </FormItem>
        )}

      </ItemPanel>
    );
  };

  const dragAndDropPanelItems = tests.map((test, index) => ({
    key: test.key,
    render: ({ dragHandleProps, isDragged, isOtherDragged }) => renderTestItemPanel({ test, index, dragHandleProps, isDragged, isOtherDragged })
  }));

  return (
    <div>
      <Form layout="horizontal" labelAlign="left">
        <FormItem label={t('common:title')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={content.title} onChange={handleTitleChanged} />
        </FormItem>
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={content.width} onChange={handleWidthChanged} />
        </FormItem>
        <FormItem label={t('testsOrder')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={content.testsOrder} onChange={handleTestsOrderChange}>
            <RadioButton value={TESTS_ORDER.given}>{t('testsOrderGiven')}</RadioButton>
            <RadioButton value={TESTS_ORDER.random}>{t('testsOrderRandom')}</RadioButton>
          </RadioGroup>
        </FormItem>

        <DragAndDropContainer droppableId={droppableIdRef.current} items={dragAndDropPanelItems} onItemMove={handleMoveTest} />
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
