import { Button, Radio } from 'antd';
import React, { useState } from 'react';
import { TESTS_ORDER } from './constants.js';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import QuickTesterIcon from './quick-tester-icon.js';
import { shuffleItems } from '../../utils/array-utils.js';
import Collapsible from '../../components/collapsible.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
function QuickTesterDisplay({ content }) {
  const { t } = useTranslation('quickTester');
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [tests, setTests] = useState(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);

  const resetTests = () => {
    setCurrentTestIndex(0);
    setIsAnswerVisible(false);
    setTests(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);
  };

  const handleAnswerVisibilityChange = event => {
    const { value } = event.target;
    setIsAnswerVisible(value);
  };

  const handlePreviousTestClick = () => {
    setIsAnswerVisible(false);
    setCurrentTestIndex(i => i - 1);
  };

  const handleNextTestClick = () => {
    setIsAnswerVisible(false);
    setCurrentTestIndex(i => i + 1);
  };

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
          <div className="QuickTesterDisplay-controlPanel">
            <div>cards</div>
            <div className="QuickTesterDisplay-buttons">
              <Button
                shape="circle"
                icon={<LeftOutlined />}
                disabled={currentTestIndex === 0}
                onClick={handlePreviousTestClick}
                />
              <Button
                shape="circle"
                icon={<ReloadOutlined />}
                onClick={resetTests}
                />
              <Button
                shape="circle"
                icon={<RightOutlined />}
                disabled={currentTestIndex === tests.length - 1}
                onClick={handleNextTestClick}
                />
            </div>
          </div>
          <div className="QuickTesterDisplay-test">
            {!isAnswerVisible && <Markdown renderMedia={content.renderMedia}>{tests?.[currentTestIndex]?.question}</Markdown>}
            {isAnswerVisible && <Markdown renderMedia={content.renderMedia}>{tests?.[currentTestIndex]?.answer}</Markdown>}
          </div>
          <RadioGroup className="QuickTesterDisplay-radioGroup" value={isAnswerVisible} onChange={handleAnswerVisibilityChange}>
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
