import { useTranslation } from 'react-i18next';
import { SOUND_TYPE, TESTS_ORDER } from '../constants.js';
import React, { useEffect, useRef, useState } from 'react';
import { shuffleItems } from '../../../utils/array-utils.js';
import AudioPlayer from '../../../components/audio-player.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { useService } from '../../../components/container-context.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown.js';

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
  const githubFlavoredMarkdown = useService(GithubFlavoredMarkdown);

  const abcContainerRef = useRef();
  const midiContainerRef = useRef();

  const { title, maxWidth } = content;
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
      abcjs.renderAbc(abcContainerRef.current, showResult ? currentTest.fullAbcCode : currentTest.startAbcCode, abcOptions);
      abcjs.renderMidi(midiContainerRef.current, currentTest.fullAbcCode, midiOptions);
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
    let legendHtml = '';
    let soundType = SOUND_TYPE.midi;
    const currentTest = tests[currentIndex];

    if (currentTest.sound && currentTest.sound.type === SOUND_TYPE.internal) {
      soundType = SOUND_TYPE.internal;
      soundUrl = currentTest.sound.url ? `${clientConfig.cdnRootUrl}/${currentTest.sound.url}` : null;
      legendHtml = currentTest.sound.text || '';
    }

    if (currentTest.sound && currentTest.sound.type === SOUND_TYPE.external) {
      soundType = SOUND_TYPE.external;
      soundUrl = currentTest.sound.url || null;
      legendHtml = currentTest.sound.text || '';
    }

    return soundType === SOUND_TYPE.midi
      ? <div ref={midiContainerRef} />
      : <AudioPlayer soundUrl={soundUrl} legendHtml={legendHtml} />;
  };

  const renderButtons = () => {
    const buttons = [];
    if (showResult && currentIndex < tests.length - 1) {
      buttons.push(<button key="next" type="button" onClick={handleNextClick}>{t('nextExercise')}</button>);
    }
    if (tests[currentIndex] && !showResult) {
      buttons.push(<button key="result" type="button" onClick={handleResultClick}>{t('solve')}</button>);
    }
    buttons.push(<button key="reset" type="button" onClick={handleResetClick}>{t('reset')}</button>);

    return buttons;
  };

  return (
    <div className="EarTraining fa5">
      <div className={`EarTraining-testWrapper u-max-width-${maxWidth || 100}`}>
        <h3
          className="EarTraining-header"
          dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(title) }}
          />
        <div ref={abcContainerRef} />
        {renderSoundPlayer()}
        <div className="EarTraining-buttons">
          {renderButtons()}
        </div>
      </div>
    </div>
  );
}

EarTrainingDisplay.propTypes = {
  ...sectionDisplayProps
};

export default EarTrainingDisplay;
