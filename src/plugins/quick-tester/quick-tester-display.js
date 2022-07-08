import { Radio, Tooltip } from 'antd';
import { TESTS_ORDER } from './constants.js';
import { useTranslation } from 'react-i18next';
import { SwapOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import Markdown from '../../components/markdown.js';
import QuickTesterIcon from './quick-tester-icon.js';
import Collapsible from '../../components/collapsible.js';
import CardSelector from '../../components/card-selector.js';
import IterationPanel from '../../components/iteration-panel.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { ensureIsIncluded, shuffleItems } from '../../utils/array-utils.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

function QuickTesterDisplay({ content }) {
  const { t } = useTranslation('quickTester');

  const [tests, setTests] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [viewedTestIndices, setViewedTestIndices] = useState([0]);
  const [isCurrentTestAnswerVisible, setIsCurrentTestAnswerVisible] = useState(false);

  useEffect(() => {
    setTests(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);
  }, [content.testsOrder, content.tests]);

  useEffect(() => {
    setViewedTestIndices(previousIndices => ensureIsIncluded(previousIndices, currentTestIndex));
  }, [currentTestIndex]);

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
    setCurrentTestIndex(i => i - 1);
    setIsCurrentTestAnswerVisible(false);
  };

  const handleNextTestClick = () => {
    setCurrentTestIndex(i => i + 1);
    setIsCurrentTestAnswerVisible(false);
  };

  const handleResetTestsClick = () => {
    setCurrentTestIndex(0);
    setViewedTestIndices([0]);
    setIsCurrentTestAnswerVisible(false);
    setTests(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);
  };

  const testCards = tests.map((test, index) => ({ label: (index + 1).toString(), tooltip: t('testNumber', { number: index }) }));

  return (
    <div className="QuickTesterDisplay">
      <Collapsible
        title={<Markdown inline>{content.teaser}</Markdown>}
        isCollapsible
        isCollapsed
        icon={<QuickTesterIcon />}
        >
        <div className="QuickTesterDisplay-content">
          <Markdown inline>{content.title}</Markdown>
          {testCards.length > 1 && (
            <div className="QuickTesterDisplay-controlPanel">
              <div>
                <CardSelector
                  cards={testCards}
                  selectedCardIndex={currentTestIndex}
                  previouslySelectedCardIndices={viewedTestIndices}
                  onCardSelected={handleTestCardSelected}
                  />
                {content.testsOrder === TESTS_ORDER.random && (
                  <Tooltip title={t('common:randomizedTests')}>
                    <SwapOutlined className="QuickTesterDisplay-randomTestsIcon" />
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
          <div className="QuickTesterDisplay-test">
            {!isCurrentTestAnswerVisible && <Markdown renderMedia={content.renderMedia}>{tests?.[currentTestIndex]?.question}</Markdown>}
            {isCurrentTestAnswerVisible && <Markdown renderMedia={content.renderMedia}>{tests?.[currentTestIndex]?.answer}</Markdown>}
          </div>
          <RadioGroup className="QuickTesterDisplay-radioGroup" value={isCurrentTestAnswerVisible} onChange={handleAnswerVisibilityChange}>
            <RadioButton className="QuickTesterDisplay-radioButton" value={false}>{t('common:question')}</RadioButton>
            <RadioButton className="QuickTesterDisplay-radioButton" value>{t('common:answer')}</RadioButton>
          </RadioGroup>
        </div>
      </Collapsible>
    </div>
  );
}

QuickTesterDisplay.propTypes = {
  ...sectionDisplayProps
};

export default QuickTesterDisplay;
