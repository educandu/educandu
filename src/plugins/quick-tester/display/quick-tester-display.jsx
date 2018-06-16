const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');
const { inject } = require('../../../components/container-context.jsx');
const arrayShuffle = require('array-shuffle');
const PropTypes = require('prop-types');
const React = require('react');

class QuickTesterDisplay extends React.Component {
  constructor(props) {
    super(props);

    const { preferredLanguages, section } = this.props;
    const data = section.content[preferredLanguages[0]];

    this.state = {
      name: data.name,
      teaser: data.teaser,
      tests: data.tests,
      currentIndex: -1,
      showResult: false
    };

    this.handleInitClick = this.handleInitClick.bind(this);
    this.handleResultClick = this.handleResultClick.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
    this.handleResetClick = this.handleResetClick.bind(this);
  }

  shouldComponentUpdate() {
    return true;
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
    const { githubFlavoredMarkdown } = this.props;
    const { name, teaser, tests, currentIndex, showResult } = this.state;

    if (currentIndex === -1) {
      return (
        <div className="QuickTester">
          <a className="QuickTester-initLink" onClick={this.handleInitClick}>{teaser}</a>
        </div>
      );
    }

    const currentTest = tests[currentIndex];

    const buttons = [];

    if (showResult && currentIndex < tests.length - 1) {
      buttons.push(<button type="button" key="next" onClick={this.handleNextClick}>Nächste Frage</button>);
    }

    if (!showResult) {
      buttons.push(<button type="button" key="result" onClick={this.handleResultClick}>Lösung</button>);
    }

    buttons.push(<button type="button" key="reset" onClick={this.handleResetClick}>Beenden</button>);

    return (
      <div className="QuickTester">
        <h3 className="QuickTester-header">{name}</h3>
        <div className="QuickTester-test">
          <div
            className="QuickTester-question"
            dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(currentTest.question) }}
            />
          {showResult && <div
            className="QuickTester-answer"
            dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(currentTest.answer) }}
            />}
        </div>
        <div className="QuickTester-buttons">
          {buttons}
        </div>
      </div>
    );
  }
}

QuickTesterDisplay.propTypes = {
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired,
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, QuickTesterDisplay);
