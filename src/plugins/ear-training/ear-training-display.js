import classNames from 'classnames';
import { Radio, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import { SwapOutlined } from '@ant-design/icons';
import Markdown from '../../components/markdown.js';
import { shuffleItems } from '../../utils/array-utils.js';
import MediaPlayer from '../../components/media-player.js';
import AbcNotation from '../../components/abc-notation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import CardSelector from '../../components/card-selector.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import IterationPanel from '../../components/iteration-panel.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { SOUND_SOURCE_TYPE, TESTS_ORDER, TEST_MODE } from './constants.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

function EarTrainingDisplay({ content }) {
  const { t } = useTranslation('earTraining');
  const clientConfig = useService(ClientConfig);

  const questionImageRef = useRef();
  const answerImageCanvasRef = useRef();

  const [tests, setTests] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [viewedTestIndices, setViewedTestIndices] = useState([0]);
  const [isCurrentTestAnswerVisible, setIsCurrentTestAnswerVisible] = useState(false);
  const [isCurrentQuestionImageLoaded, setIsCurrentQuestionImageLoaded] = useState(false);

  const { title, width } = content;
  const currentTest = tests[currentTestIndex] || null;

  useEffect(() => {
    setTests(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);
  }, [content.testsOrder, content.tests]);

  useEffect(() => {
    setIsCurrentQuestionImageLoaded(false);

    const questionImage = questionImageRef.current;
    if (!questionImage || currentTest.mode !== TEST_MODE.image) {
      return;
    }

    if (questionImage.complete) {
      setIsCurrentQuestionImageLoaded(questionImage.naturalHeight !== 0);
    } else {
      questionImage.onload = () => setIsCurrentQuestionImageLoaded(true);
    }
  }, [currentTest, questionImageRef]);

  useEffect(() => {
    if (!tests.length || currentTest.mode !== TEST_MODE.image || !isCurrentQuestionImageLoaded) {
      return;
    }
    const questionImage = questionImageRef.current;
    const canvas = answerImageCanvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = questionImage.width;
    canvas.height = questionImage.height;

    const answerImage = new Image();
    answerImage.src = urlUtils.getImageUrl({
      cdnRootUrl: clientConfig.cdnRootUrl,
      sourceType: currentTest.answerImage.sourceType,
      sourceUrl: currentTest.answerImage.sourceUrl
    });

    answerImage.onload = () => {
      const widthFactor = canvas.width / answerImage.naturalWidth;
      const heightFactor = canvas.height / answerImage.naturalHeight;
      const factorToUse = Math.min(heightFactor, widthFactor);
      const finalHeight = answerImage.naturalHeight * factorToUse;
      const finalWidth = answerImage.naturalWidth * factorToUse;
      context.drawImage(answerImage, 0, 0, answerImage.naturalWidth, answerImage.naturalHeight, 0, 0, finalWidth, finalHeight);
    };
  }, [tests, currentTest, questionImageRef, answerImageCanvasRef, clientConfig, isCurrentQuestionImageLoaded]);

  const handleAnswerVisibilityChange = event => {
    const { value } = event.target;
    setIsCurrentTestAnswerVisible(value);
  };

  const handleTestCardSelected = testIndex => {
    if (currentTestIndex !== testIndex) {
      setCurrentTestIndex(testIndex);
      setIsCurrentTestAnswerVisible(false);
    }
  };

  const handlePreviousTestClick = () => {
    setCurrentTestIndex(index => index - 1);
    setIsCurrentTestAnswerVisible(false);
  };

  const handleNextTestClick = () => {
    setCurrentTestIndex(index => index + 1);
    setIsCurrentTestAnswerVisible(false);
  };

  const handleResetTestsClick = () => {
    setCurrentTestIndex(0);
    setViewedTestIndices([0]);
    setIsCurrentTestAnswerVisible(false);
    setTests(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);
  };

  const renderSoundPlayer = () => {
    let soundUrl = null;
    let sourceType = SOUND_SOURCE_TYPE.midi;

    if (currentTest.sound && currentTest.sound.sourceType === SOUND_SOURCE_TYPE.internal) {
      sourceType = SOUND_SOURCE_TYPE.internal;
      soundUrl = currentTest.sound.sourceUrl ? `${clientConfig.cdnRootUrl}/${currentTest.sound.sourceUrl}` : null;
    }

    if (currentTest.sound && currentTest.sound.sourceType === SOUND_SOURCE_TYPE.external) {
      sourceType = SOUND_SOURCE_TYPE.external;
      soundUrl = currentTest.sound.sourceUrl || null;
    }

    return (
      <div className="EarTrainingDisplay-soundPlayer">
        {sourceType === SOUND_SOURCE_TYPE.midi && (
          <AbcNotation abcCode={currentTest.answerAbcCode} displayMidi hideNotes />
        )}
        {sourceType !== SOUND_SOURCE_TYPE.midi && soundUrl && (
          <MediaPlayer
            source={soundUrl}
            screenMode={MEDIA_SCREEN_MODE.none}
            canDownload={sourceType === SOUND_SOURCE_TYPE.internal}
            />
        )}
        <CopyrightNotice value={currentTest.sound.copyrightNotice} />
      </div>
    );
  };

  const questionImageClasses = classNames(
    'EarTrainingDisplay-questionImage',
    { 'EarTrainingDisplay-questionImage--toggledOff': isCurrentTestAnswerVisible },
    `u-width-${width}`
  );

  const testCards = tests.map((test, index) => ({ label: (index + 1).toString(), tooltip: t('testNumber', { number: index + 1 }) }));

  return (
    <div className="EarTrainingDisplay fa5">
      <div className={`EarTrainingDisplay-contentWrapper u-width-${width}`}>
        <h3>
          <Markdown inline>{title}</Markdown>
        </h3>
        {testCards.length > 1 && (
          <div className="EarTrainingDisplay-controlPanel">
            <div>
              <CardSelector
                cards={testCards}
                onCardSelected={handleTestCardSelected}
                selectedCardIndex={currentTestIndex}
                visitedCardIndices={viewedTestIndices}
                treatSelectedCardAsVisited
                />
              {content.testsOrder === TESTS_ORDER.random && (
                <Tooltip title={t('common:randomizedTests')}>
                  <SwapOutlined className="EarTrainingDisplay-randomTestsIcon" />
                </Tooltip>
              )}
            </div>
            <IterationPanel
              itemCount={testCards.length}
              selectedItemIndex={currentTestIndex}
              onNextClick={handleNextTestClick}
              onPreviousClick={handlePreviousTestClick}
              onResetClick={handleResetTestsClick}
              />
          </div>
        )}
        {tests.length && (
          <div className="EarTrainingDisplay-test">
            {currentTest.mode === TEST_MODE.image && (
              <Fragment>
                <img
                  ref={questionImageRef}
                  className={questionImageClasses}
                  src={urlUtils.getImageUrl({
                    cdnRootUrl: clientConfig.cdnRootUrl,
                    sourceType: currentTest.questionImage.sourceType,
                    sourceUrl: currentTest.questionImage.sourceUrl
                  })}
                  />
                {!isCurrentTestAnswerVisible && <CopyrightNotice value={currentTest.questionImage.copyrightNotice} />}
              </Fragment>
            )}
            {currentTest.mode === TEST_MODE.image && (
              <Fragment>
                <canvas ref={answerImageCanvasRef} className={`EarTrainingDisplay-answerImage u-width-${width}`} />
                {isCurrentTestAnswerVisible && <CopyrightNotice value={currentTest.answerImage.copyrightNotice} /> }
              </Fragment>
            )}
            {currentTest.mode === TEST_MODE.abcCode && (
              <AbcNotation abcCode={isCurrentTestAnswerVisible ? currentTest.answerAbcCode : currentTest.questionAbcCode} />
            )}

            {renderSoundPlayer()}
          </div>
        )}

        <RadioGroup className="EarTrainingDisplay-radioGroup" value={isCurrentTestAnswerVisible} onChange={handleAnswerVisibilityChange}>
          <RadioButton className="EarTrainingDisplay-radioButton" value={false}>{t('common:question')}</RadioButton>
          <RadioButton className="EarTrainingDisplay-radioButton" value>{t('common:answer')}</RadioButton>
        </RadioGroup>
      </div>
    </div>
  );
}

EarTrainingDisplay.propTypes = {
  ...sectionDisplayProps
};

export default EarTrainingDisplay;
