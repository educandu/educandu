import React, { useCallback, useEffect, useState } from 'react';
import { Button } from 'antd';
import { TESTS_ORDER } from '../constants.js';
import { useTranslation } from 'react-i18next';
import Markdown from '../../../components/markdown.js';
import { shuffleItems } from '../../../utils/array-utils.js';
import CloseIcon from '../../../components/icons/general/close-icon.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';
import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';

function QuickTesterDisplay({ content }) {
  const [tests, setTests] = useState([]);
  const { t } = useTranslation('quickTester');
  const [isOpen, setIsOpen] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  const restart = useCallback(() => {
    setCurrentTestIndex(0);
    setIsAnswerVisible(false);
    setTests(content.testsOrder === TESTS_ORDER.random ? shuffleItems(content.tests) : content.tests);
  }, [content.tests, content.testsOrder]);

  useEffect(() => {
    if (isOpen) {
      restart();
    }

  }, [isOpen, restart]);

  const showAnswer = () => {
    setIsAnswerVisible(true);
  };

  const movePrevious = () => {
    setIsAnswerVisible(false);
    setCurrentTestIndex(i => i - 1);
  };

  const moveNext = () => {
    setIsAnswerVisible(false);
    setCurrentTestIndex(i => i + 1);
  };

  const open = () => {
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const percentDone = tests.length
    ? Math.max(0, Math.min(100, Math.round(((currentTestIndex + 1) / tests.length) * 100)))
    : 100;

  if (!isOpen || !tests.length) {
    return (
      <div className="QuickTester">
        <div className="QuickTester-content">
          <Markdown
            tag="a"
            className="QuickTester-initLink"
            disabled={!content.tests.length}
            onClick={open}
            inline
            >
            {content.teaser}
          </Markdown>
        </div>
      </div>
    );
  }

  const answerDisplay = isAnswerVisible
    ? <Markdown renderMedia={content.renderMedia}>{tests[currentTestIndex].answer}</Markdown>
    : <Button type="primary" size="large" onClick={showAnswer}>{t('showAnswer')}</Button>;

  return (
    <div className="QuickTester">
      <div className="QuickTester-content">
        <div className="QuickTester-header">
          <div className="QuickTester-title">
            <Markdown inline>{content.title}</Markdown>
          </div>
          <div className="QuickTester-closeButton">
            <Button size="small" icon={<CloseIcon />} onClick={close} />
          </div>
        </div>
        <div className="QuickTester-progress" style={{ width: `${percentDone}%` }} />
        <div className="QuickTester-test">
          <div className="QuickTester-question">
            <div className="QuickTester-questionHeader">
              {t('questionHeader', { currentTest: currentTestIndex + 1, testsLength: tests.length })}
            </div>
            <div className="QuickTester-questionBody">
              <Markdown renderMedia={content.renderMedia}>{tests[currentTestIndex].question}</Markdown>
            </div>
          </div>
          <div className="QuickTester-answer">
            {answerDisplay}
          </div>
        </div>
        <div className="QuickTester-buttons">
          <Button
            className="QuickTester-button"
            shape="circle"
            icon={<LeftOutlined />}
            disabled={currentTestIndex < 1}
            onClick={movePrevious}
            />
          <Button
            className="QuickTester-button"
            shape="circle"
            icon={<ReloadOutlined />}
            onClick={restart}
            />
          <Button
            className="QuickTester-button"
            shape="circle"
            icon={<RightOutlined />}
            disabled={!isAnswerVisible || currentTestIndex > tests.length - 2}
            onClick={moveNext}
            />
        </div>
      </div>
    </div>
  );
}

QuickTesterDisplay.propTypes = {
  ...sectionDisplayProps
};

export default QuickTesterDisplay;
