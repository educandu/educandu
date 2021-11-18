import React from 'react';
import autoBind from 'auto-bind';
import { SOUND_TYPE } from '../constants.js';
import { withTranslation } from 'react-i18next';
import { shuffleItems } from '../../../utils/array-utils.js';
import AudioPlayer from '../../../components/audio-player.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { inject } from '../../../components/container-context.js';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown.js';
import { sectionDisplayProps, clientConfigProps, translationProps } from '../../../ui/default-prop-types.js';

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

class EarTrainingDisplay extends React.Component {
  constructor(props) {
    super(props);

    autoBind(this);

    this.abcjs = null;
    this.canRenderAbc = false;
    this.abcContainerRef = React.createRef();
    this.midiContainerRef = React.createRef();

    const { content } = this.props;

    this.state = {
      title: content.title,
      maxWidth: content.maxWidth,
      tests: shuffleItems(content.tests),
      currentIndex: 0,
      showResult: false
    };
  }

  async componentDidMount() {
    this.canRenderAbc = true;
    const { default: abcjs } = await import('abcjs/midi.js');
    this.abcjs = abcjs;

    if (this.canRenderAbc) {
      const { tests, currentIndex, showResult } = this.state;
      const currentTest = tests[currentIndex];
      this.abcjs.renderAbc(this.abcContainerRef.current, showResult ? currentTest.fullAbcCode : currentTest.startAbcCode, abcOptions);
      this.abcjs.renderMidi(this.midiContainerRef.current, currentTest.fullAbcCode, midiOptions);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.abcjs) {
      const { tests, currentIndex, showResult } = this.state;
      const currentTest = tests[currentIndex];
      this.abcjs.renderAbc(this.abcContainerRef.current, showResult ? currentTest.fullAbcCode : currentTest.startAbcCode, abcOptions);
      if (tests !== prevState.tests || currentIndex !== prevState.currentIndex) {
        this.abcjs.renderMidi(this.midiContainerRef.current, currentTest.fullAbcCode, midiOptions);
      }
    }
  }

  componentWillUnmount() {
    this.canRenderAbc = false;
  }

  handleResultClick() {
    this.setState({ showResult: true });
  }

  handleNextClick() {
    const { currentIndex } = this.state;
    this.setState({ currentIndex: currentIndex + 1, showResult: false });
  }

  handleResetClick() {
    const { tests } = this.state;
    this.setState({ tests: shuffleItems(tests), currentIndex: 0, showResult: false });
  }

  render() {
    const { clientConfig, githubFlavoredMarkdown, t } = this.props;
    const { title, maxWidth, tests, currentIndex, showResult } = this.state;

    const currentTest = tests[currentIndex];

    let soundType;
    let soundUrl;
    let legendHtml;
    if (currentTest.sound && currentTest.sound.type === SOUND_TYPE.internal) {
      soundType = SOUND_TYPE.internal;
      soundUrl = currentTest.sound.url ? `${clientConfig.cdnRootUrl}/${currentTest.sound.url}` : null;
      legendHtml = currentTest.sound.text || '';
    } else if (currentTest.sound && currentTest.sound.type === SOUND_TYPE.external) {
      soundType = SOUND_TYPE.external;
      soundUrl = currentTest.sound.url || null;
      legendHtml = currentTest.sound.text || '';
    } else {
      soundType = SOUND_TYPE.midi;
      soundUrl = null;
      legendHtml = '';
    }

    const soundPlayer = soundType === SOUND_TYPE.midi
      ? <div ref={this.midiContainerRef} />
      : <AudioPlayer soundUrl={soundUrl} legendHtml={legendHtml} />;

    const buttons = [];

    if (showResult && currentIndex < tests.length - 1) {
      buttons.push(<button key="next" type="button" onClick={this.handleNextClick}>{t('nextExercise')}</button>);
    }

    if (currentTest && !showResult) {
      buttons.push(<button key="result" type="button" onClick={this.handleResultClick}>{t('solve')}</button>);
    }

    buttons.push(<button key="reset" type="button" onClick={this.handleResetClick}>{t('reset')}</button>);

    return (
      <div className="EarTraining fa5">
        <div className={`EarTraining-testWrapper u-max-width-${maxWidth || 100}`}>
          <h3
            className="EarTraining-header"
            dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(title) }}
            />
          <div ref={this.abcContainerRef} />
          {soundPlayer}
          <div className="EarTraining-buttons">
            {buttons}
          </div>
        </div>
      </div>
    );
  }
}

EarTrainingDisplay.propTypes = {
  ...translationProps,
  ...sectionDisplayProps,
  ...clientConfigProps
};

export default withTranslation('earTraining')(inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown,
  clientConfig: ClientConfig
}, EarTrainingDisplay));
