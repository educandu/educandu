const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const arrayShuffle = require('array-shuffle');
const memoizeLast = require('../../../utils/memoize-last');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

class QuickTesterDisplay extends React.Component {
  constructor(props) {
    super(props);

    autoBind.react(this);

    const { githubFlavoredMarkdown, content } = this.props;

    this.renderMarkdown = memoizeLast(s => githubFlavoredMarkdown.render(s), 100, s => s);

    this.state = {
      title: content.title,
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
    const { title, teaser, tests, currentIndex, showResult } = this.state;

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

    if (currentTest && !showResult) {
      buttons.push(<button key="result" type="button" onClick={this.handleResultClick}>Lösung</button>);
    }

    buttons.push(<button key="reset" type="button" onClick={this.handleResetClick}>Beenden</button>);

    let testComponent;
    if (currentTest) {
      testComponent = (
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
      );
    } else {
      testComponent = <div>N/A</div>;
    }

    return (
      <div className="QuickTester">
        <h3
          className="QuickTester-header"
          dangerouslySetInnerHTML={{ __html: this.renderMarkdown(title) }}
          />
        {testComponent}
        <div className="QuickTester-buttons">
          {buttons}
        </div>
      </div>
    );
  }
}

QuickTesterDisplay.propTypes = {
  ...sectionDisplayProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, QuickTesterDisplay);
