const React = require('react');
const Button = require('antd/lib/button');
const arrayShuffle = require('array-shuffle');
const Markdown = require('../../../components/markdown.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

function QuickTesterDisplay({ content }) {
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(-1);
  const [tests, setTests] = React.useState(arrayShuffle(content.tests));
  const restart = React.useCallback(() => {
    setTests(arrayShuffle(content.tests));
    setShowAnswer(false);
    setCurrentIndex(0);
  }, [content.tests]);
  const moveToIndex = React.useCallback(index => {
    setShowAnswer(false);
    setCurrentIndex(index);
  }, []);

  if (currentIndex === -1) {
    return (
      <div className="QuickTester">
        <div className="QuickTester-content">
          <Markdown
            tag="a"
            className="QuickTester-initLink"
            onClick={restart}
            inline
            >
            {content.teaser}
          </Markdown>
        </div>
      </div>
    );
  }

  let testProgress = null;
  let testArea = null;
  if (tests.length) {
    const percentDone = Math.max(0, Math.min(100, Math.round(((currentIndex + 1) / tests.length) * 100)));

    testProgress = <div className="QuickTester-progress" style={{ width: `${percentDone}%` }} />;
    const answerArea = showAnswer
      ? <Markdown inline>{tests[currentIndex].answer}</Markdown>
      : <Button type="primary" size="large" onClick={() => setShowAnswer(true)}>Antwort anzeigen</Button>;

    testArea = (
      <React.Fragment>
        <div className="QuickTester-question">
          <div className="QuickTester-questionHeader">Frage {currentIndex + 1} von {tests.length}</div>
          <Markdown>{tests[currentIndex].question}</Markdown>
        </div>
        <div className="QuickTester-answer">
          {answerArea}
        </div>
      </React.Fragment>
    );
  }

  return (
    <div className="QuickTester">
      <div className="QuickTester-content">
        <div className="QuickTester-header">
          <div className="QuickTester-title">
            <Markdown inline>{content.title}</Markdown>
          </div>
          <div className="QuickTester-closeButton">
            <Button size="small" icon="close" onClick={() => moveToIndex(-1)} ghost />
          </div>
        </div>
        {testProgress}
        <div className="QuickTester-test">
          {testArea}
        </div>
        <div className="QuickTester-buttons">
          <Button
            className="QuickTester-button"
            shape="circle"
            icon="left"
            disabled={currentIndex === 0}
            onClick={() => moveToIndex(currentIndex - 1)}
            />
          <Button
            className="QuickTester-button"
            shape="circle"
            icon="reload"
            onClick={restart}
            />
          <Button
            className="QuickTester-button"
            shape="circle"
            icon="right"
            disabled={!showAnswer || currentIndex === tests.length - 1}
            onClick={() => moveToIndex(currentIndex + 1)}
            />
        </div>
      </div>
    </div>
  );
}

QuickTesterDisplay.propTypes = {
  ...sectionDisplayProps
};

module.exports = QuickTesterDisplay;
