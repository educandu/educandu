import { Button } from 'antd';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import { getImageUrl } from '../../utils/url-utils.js';
import { shuffleItems } from '../../utils/array-utils.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { SOUND_SOURCE_TYPE, TESTS_ORDER, TEST_MODE } from './constants.js';

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

function EarTrainingDisplay({ content }) {
  const { t } = useTranslation('earTraining');
  const clientConfig = useService(ClientConfig);

  const abcContainerRef = useRef();
  const midiContainerRef = useRef();
  const questionImageRef = useRef();
  const answerImageCanvasRef = useRef();

  const { title, width } = content;
  const [abcjs, setAbcjs] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [isCurrentQuestionImageLoaded, setIsCurrentQuestionImageLoaded] = useState(false);
  const [tests, setTests] = useState(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);

  useEffect(() => {
    (async () => {
      const abcjsModule = await import('abcjs/midi.js');
      setAbcjs(abcjsModule.default);
    })();
  });

  useEffect(() => {
    const currentTest = tests[currentTestIndex];

    if (currentTest.mode === TEST_MODE.abcCode && abcjs) {
      abcjs.renderAbc(abcContainerRef.current, showResult ? currentTest.answerAbcCode : currentTest.questionAbcCode, abcOptions);
      abcjs.renderMidi(midiContainerRef.current, currentTest.answerAbcCode, midiOptions);
    }
  }, [abcjs, tests, currentTestIndex, showResult]);

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
    if (tests[currentTestIndex].mode !== TEST_MODE.image || !isCurrentQuestionImageLoaded) {
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
  }, [tests, currentTestIndex, showResult, questionImageRef, answerImageCanvasRef, clientConfig, isCurrentQuestionImageLoaded]);

  const handleResultClick = () => {
    setShowResult(true);
  };

  const handleNextClick = () => {
    setCurrentTestIndex(currentTestIndex + 1);
    setShowResult(false);
  };

  const handleResetClick = () => {
    setCurrentTestIndex(0);
    setShowResult(false);
    setTests(shuffleItems(tests));
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
    { 'EarTrainingDisplay-questionImage--toggledOff': showResult },
    `u-width-${width}`
  );

  return (
    <div className="EarTrainingDisplay fa5">
      <div className={`EarTrainingDisplay-testWrapper u-width-${width}`}>
        <h3>
          <Markdown inline>{title}</Markdown>
        </h3>
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
            <Markdown>{tests[currentTestIndex].questionImage.text}</Markdown>
          </Fragment>
        )}
        {tests[currentTestIndex].mode === TEST_MODE.image && (
          <canvas ref={answerImageCanvasRef} className={`EarTrainingDisplay-answerImage u-width-${width}`} />
        )}
        {tests[currentTestIndex].mode === TEST_MODE.abcCode && (
          <div ref={abcContainerRef} />
        )}

        {renderSoundPlayer()}

        <div className="EarTrainingDisplay-buttons">
          <Button onClick={handleResetClick}>{t('reset')}</Button>
          {!showResult && !!tests[currentTestIndex] && (
            <Button type="primary" onClick={handleResultClick}>{t('solve')}</Button>
          )}
          {showResult && currentTestIndex < tests.length - 1 && (
            <Button type="primary" onClick={handleNextClick}>{t('nextExercise')}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

EarTrainingDisplay.propTypes = {
  ...sectionDisplayProps
};

export default EarTrainingDisplay;
