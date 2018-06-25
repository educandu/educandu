const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const arrayShuffle = require('array-shuffle');
const memoizeLast = require('../../../utils/memoize-last');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

class QuickTesterContentDisplay extends React.Component {
  constructor(props) {
    super(props);

    autoBind.react(this);

    const { githubFlavoredMarkdown, content } = this.props;

    this.renderMarkdown = memoizeLast(s => githubFlavoredMarkdown.render(s), 100, s => s);

    this.state = {
      name: content.name,
      teaser: content.teaser,
      tests: content.tests,
      currentIndex: -1,
      showResult: false
    };
  }

  handleInitClick() {
    const { tests } = this.state;
    this.setState({ tests: arrayShuffle(tests), currentIndex: 0, showResult: false });
  }

  handleResultClick() {
    this.setState({ showResult: true });
  }

  handleNextClick() {
    const { currentIndex } = this.state;
    this.setState({ currentIndex: currentIndex + 1, showResult: false });
  }

  handleResetClick() {
    this.setState({ currentIndex: -1, showResult: false });
  }

  render() {
    const { name, teaser, tests, currentIndex, showResult } = this.state;

    if (currentIndex === -1) {
      return (
        <div className="QuickTester">
          <a
            className="QuickTester-initLink"
            onClick={this.handleInitClick}
            dangerouslySetInnerHTML={{ __html: this.renderMarkdown(teaser) }}
            />
        </div>
      );
    }

    const currentTest = tests[currentIndex];

    const buttons = [];

    if (showResult && currentIndex < tests.length - 1) {
      buttons.push(<button key="next" type="button" onClick={this.handleNextClick}>Nächste Frage</button>);
    }

    if (!showResult) {
      buttons.push(<button key="result" type="button" onClick={this.handleResultClick}>Lösung</button>);
    }

    buttons.push(<button key="reset" type="button" onClick={this.handleResetClick}>Beenden</button>);

    return (
      <div className="QuickTester">
        <h3
          className="QuickTester-header"
          dangerouslySetInnerHTML={{ __html: this.renderMarkdown(name) }}
          />
        <div className="QuickTester-test">
          <div
            className="QuickTester-question"
            dangerouslySetInnerHTML={{ __html: this.renderMarkdown(currentTest.question) }}
            />
          {showResult && <div
            className="QuickTester-answer"
            dangerouslySetInnerHTML={{ __html: this.renderMarkdown(currentTest.answer) }}
            />}
        </div>
        <div className="QuickTester-buttons">
          {buttons}
        </div>
      </div>
    );
  }
}

QuickTesterContentDisplay.propTypes = {
  ...sectionDisplayProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

const Injected = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, QuickTesterContentDisplay);

// Wrapper:
/* eslint react/no-multi-comp: 0 */

function QuickTesterDisplay({ preferredLanguages, section }) {
  const language = preferredLanguages[0];
  const content = section.content[language];

  return (
    <Injected content={content} language={language} />
  );
}

QuickTesterDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = QuickTesterDisplay;
