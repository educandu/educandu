import classNames from 'classnames';
import { Radio, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { SwapOutlined } from '@ant-design/icons';
import Markdown from '../../components/markdown.js';
import { getImageUrl } from '../../utils/url-utils.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import CardSelector from '../../components/card-selector.js';
import IterationPanel from '../../components/iteration-panel.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { SOUND_SOURCE_TYPE, TESTS_ORDER, TEST_MODE } from './constants.js';
import { ensureIsIncluded, shuffleItems } from '../../utils/array-utils.js';

const abcOptions = {
  paddingtop: 0,
  paddingbottom: 0,
  paddingright: 0,
  paddingleft: 0,
  responsive: 'resize'
};

const midiOptions = {
  generateDownload: false,
  generateInline: true
};

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

function EarTrainingDisplay({ content }) {
  const { t } = useTranslation('earTraining');
  const clientConfig = useService(ClientConfig);

  const abcContainerRef = useRef();
  const midiContainerRef = useRef();
  const questionImageRef = useRef();
  const answerImageCanvasRef = useRef();

  const { title, width } = content;

  const [tests, setTests] = useState([]);
  const [abcjs, setAbcjs] = useState(null);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [viewedTestIndices, setViewedTestIndices] = useState([0]);
  const [isCurrentTestAnswerVisible, setIsCurrentTestAnswerVisible] = useState(false);
  const [isCurrentQuestionImageLoaded, setIsCurrentQuestionImageLoaded] = useState(false);

  useEffect(() => {
    setTests(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);
  }, [content.testsOrder, content.tests]);

  useEffect(() => {
    (async () => {
      const abcjsModule = await import('abcjs/midi.js');
      setAbcjs(abcjsModule.default);
    })();
  });

  useEffect(() => {
    setViewedTestIndices(previousIndices => ensureIsIncluded(previousIndices, currentTestIndex));
  }, [currentTestIndex]);

  useEffect(() => {
    const currentTest = tests[currentTestIndex];

    if (currentTest?.mode === TEST_MODE.abcCode && abcjs) {
      abcjs.renderAbc(abcContainerRef.current, isCurrentTestAnswerVisible ? currentTest.answerAbcCode : currentTest.questionAbcCode, abcOptions);
      abcjs.renderMidi(midiContainerRef.current, currentTest.answerAbcCode, midiOptions);
    }
  }, [abcjs, tests, currentTestIndex, isCurrentTestAnswerVisible]);

  useEffect(() => {
    setIsCurrentQuestionImageLoaded(false);

    const questionImage = questionImageRef.current;
    if (!questionImage || tests[currentTestIndex].mode !== TEST_MODE.image) {
      return;
    }

    if (questionImage.complete) {
      setIsCurrentQuestionImageLoaded(questionImage.naturalHeight !== 0);
    } else {
      questionImage.onload = () => setIsCurrentQuestionImageLoaded(true);
    }
  }, [tests, currentTestIndex, questionImageRef]);

  useEffect(() => {
    if (!tests.length || tests[currentTestIndex].mode !== TEST_MODE.image || !isCurrentQuestionImageLoaded) {
      return;
    }
    const questionImage = questionImageRef.current;
    const canvas = answerImageCanvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = questionImage.width;
    canvas.height = questionImage.height;

    const answerImage = new Image();
    answerImage.src = getImageUrl({
      cdnRootUrl: clientConfig.cdnRootUrl,
      sourceType: tests[currentTestIndex].answerImage.sourceType,
      sourceUrl: tests[currentTestIndex].answerImage.sourceUrl
    });

    answerImage.onload = () => {
      const widthFactor = canvas.width / answerImage.naturalWidth;
      const heightFactor = canvas.height / answerImage.naturalHeight;
      const factorToUse = Math.min(heightFactor, widthFactor);
      const finalHeight = answerImage.naturalHeight * factorToUse;
      const finalWidth = answerImage.naturalWidth * factorToUse;
      context.drawImage(answerImage, 0, 0, answerImage.naturalWidth, answerImage.naturalHeight, 0, 0, finalWidth, finalHeight);

    };
  }, [tests, currentTestIndex, isCurrentTestAnswerVisible, questionImageRef, answerImageCanvasRef, clientConfig, isCurrentQuestionImageLoaded]);

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
    const currentTest = tests[currentTestIndex];

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
        {sourceType === SOUND_SOURCE_TYPE.midi && <div ref={midiContainerRef} />}
        {sourceType !== SOUND_SOURCE_TYPE.midi && soundUrl && (
          <MediaPlayer
            screenMode={MEDIA_SCREEN_MODE.none}
            sourceUrl={soundUrl}
            canDownload={sourceType === SOUND_SOURCE_TYPE.internal}
            />
        )}
        {currentTest.sound.text && (
          <div>
            <Markdown>{currentTest.sound.text}</Markdown>
          </div>
        )}
      </div>
    );
  };

  const questionImageClasses = classNames(
    'EarTrainingDisplay-questionImage',
    { 'EarTrainingDisplay-questionImage--toggledOff': isCurrentTestAnswerVisible },
    `u-width-${width}`
  );

  const testCards = tests.map((test, index) => ({ label: (index + 1).toString(), tooltip: t('testNumber', { number: index }) }));

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
                previouslySelectedCardIndices={viewedTestIndices}
                />
              {content.testsOrder === TESTS_ORDER.random && (
                <Tooltip title={t('common:randomizedTests')}>
                  <SwapOutlined className="EarTrainingDisplay-randomTestsIcon" />
                </Tooltip>
              )}
            </div>
            <IterationPanel
              items={testCards}
              selectedItemIndex={currentTestIndex}
              onNextClick={handleNextTestClick}
              onPreviousClick={handlePreviousTestClick}
              onResetClick={handleResetTestsClick}
              />
          </div>
        )}
        {tests.length && (
          <div className="EarTrainingDisplay-test">
            {tests[currentTestIndex].mode === TEST_MODE.image && (
              <Fragment>
                <img
                  ref={questionImageRef}
                  className={questionImageClasses}
                  src={getImageUrl({
                    cdnRootUrl: clientConfig.cdnRootUrl,
                    sourceType: tests[currentTestIndex].questionImage.sourceType,
                    sourceUrl: tests[currentTestIndex].questionImage.sourceUrl
                  })}
                  />
                {!isCurrentTestAnswerVisible && <Markdown>{tests[currentTestIndex].questionImage.text}</Markdown>}
              </Fragment>
            )}
            {tests[currentTestIndex].mode === TEST_MODE.image && (
              <Fragment>
                <canvas ref={answerImageCanvasRef} className={`EarTrainingDisplay-answerImage u-width-${width}`} />
                {isCurrentTestAnswerVisible && <Markdown>{tests[currentTestIndex].answerImage.text}</Markdown>}
              </Fragment>
            )}
            {tests[currentTestIndex].mode === TEST_MODE.abcCode && (
              <div ref={abcContainerRef} />
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
