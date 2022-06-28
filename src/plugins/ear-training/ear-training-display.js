import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import { shuffleItems } from '../../utils/array-utils.js';
import MediaPlayer from '../../components/media-player.js';
import React, { useEffect, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { SOUND_SOURCE_TYPE, TESTS_ORDER } from './constants.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

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

  const { title, width } = content;
  const [abcjs, setAbcjs] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tests, setTests] = useState(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);

  useEffect(() => {
    (async () => {
      const abcjsModule = await import('abcjs/midi.js');
      setAbcjs(abcjsModule.default);
    })();
  });

  useEffect(() => {
    if (abcjs) {
      const currentTest = tests[currentIndex];
      abcjs.renderAbc(abcContainerRef.current, showResult ? currentTest.answerAbcCode : currentTest.questionAbcCode, abcOptions);
      abcjs.renderMidi(midiContainerRef.current, currentTest.answerAbcCode, midiOptions);
    }
  }, [abcjs, tests, currentIndex, showResult]);

  const handleResultClick = () => {
    setShowResult(true);
  };

  const handleNextClick = () => {
    setCurrentIndex(currentIndex + 1);
    setShowResult(false);
  };

  const handleResetClick = () => {
    setCurrentIndex(0);
    setShowResult(false);
    setTests(shuffleItems(tests));
  };

  const renderSoundPlayer = () => {
    let soundUrl = null;
    let sourceType = SOUND_SOURCE_TYPE.midi;
    const currentTest = tests[currentIndex];

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

  return (
    <div className="EarTrainingDisplay fa5">
      <div className={`EarTrainingDisplay-testWrapper u-width-${width}`}>
        <h3>
          <Markdown inline>{title}</Markdown>
        </h3>
        <div ref={abcContainerRef} />
        {renderSoundPlayer()}
        <div className="EarTrainingDisplay-buttons">
          <Button onClick={handleResetClick}>{t('reset')}</Button>
          {!!showResult && currentIndex < tests.length - 1 && <Button type="primary" onClick={handleNextClick}>{t('nextExercise')}</Button>}
          {!!tests[currentIndex] && !showResult && <Button type="primary" onClick={handleResultClick}>{t('solve')}</Button>}
        </div>
      </div>
    </div>
  );
}

EarTrainingDisplay.propTypes = {
  ...sectionDisplayProps
};

export default EarTrainingDisplay;
