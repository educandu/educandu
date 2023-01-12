import classNames from 'classnames';
import { Radio, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { SwapOutlined } from '@ant-design/icons';
import Markdown from '../../components/markdown.js';
import { TESTS_ORDER, TEST_MODE } from './constants.js';
import { shuffleItems } from '../../utils/array-utils.js';
import AbcNotation from '../../components/abc-notation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import CardSelector from '../../components/card-selector.js';
import React, { Fragment, useEffect, useState } from 'react';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import IterationPanel from '../../components/iteration-panel.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/plyr/media-player.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

function EarTrainingDisplay({ content }) {
  const [tests, setTests] = useState([]);
  const { t } = useTranslation('earTraining');
  const clientConfig = useService(ClientConfig);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [viewedTestIndices, setViewedTestIndices] = useState([0]);
  const [isCurrentTestAnswerVisible, setIsCurrentTestAnswerVisible] = useState(false);

  const { title, width } = content;
  const currentTest = tests[currentTestIndex] || null;

  useEffect(() => {
    setTests(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);
  }, [content.testsOrder, content.tests]);

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
    const url = getAccessibleUrl({ url: currentTest.sound.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const canDownload = isInternalSourceType({ url: currentTest.sound.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    return (
      <div className="EarTrainingDisplay-soundPlayer">
        {!!url && (
          <MediaPlayer
            sourceUrl={url}
            canDownload={canDownload}
            screenMode={MEDIA_SCREEN_MODE.none}
            />
        )}
        <CopyrightNotice value={currentTest.sound.copyrightNotice} />
      </div>
    );
  };

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
        {!!tests.length && (
          <div className="EarTrainingDisplay-test">
            {currentTest.mode === TEST_MODE.image && (
              <Fragment>
                <div className="EarTrainingDisplay-images">
                  <img
                    className={classNames({
                      'EarTrainingDisplay-image': true,
                      'EarTrainingDisplay-image--visible': isCurrentTestAnswerVisible
                    })}
                    src={getAccessibleUrl({ url: currentTest.answerImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
                    />
                  <img
                    className={classNames({
                      'EarTrainingDisplay-image': true,
                      'EarTrainingDisplay-image--visible': !isCurrentTestAnswerVisible
                    })}
                    src={getAccessibleUrl({ url: currentTest.questionImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
                    />
                </div>
                <CopyrightNotice
                  value={
                    isCurrentTestAnswerVisible
                      ? currentTest.answerImage.copyrightNotice
                      : currentTest.questionImage.copyrightNotice
                  }
                  />
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
