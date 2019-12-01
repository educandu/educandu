const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const ReactPlayer = require('react-player').default;
const colorHelper = require('../../../ui/color-helper');
const ClientSettings = require('../../../bootstrap/client-settings');
const MediaControl = require('../../../components/media-control.jsx');
const { inject } = require('../../../components/container-context.jsx');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');
const { sectionDisplayProps, clientSettingsProps } = require('../../../ui/default-prop-types');

const playStates = {
  INITIALIZING: 'initializing',
  BUFFERING: 'buffering',
  STOPPED: 'stopped',
  PLAYING: 'playing',
  PAUSING: 'pausing'
};

class AnavisDisplay extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.playerRef = React.createRef();
    this.state = {
      playState: playStates.INITIALIZING,
      durationInSeconds: 0,
      playedSeconds: 0,
      volume: 1
    };
  }

  handleReady() {
    this.setState({ playState: playStates.STOPPED });
  }

  handleBuffer() {
    this.setState({ playState: playStates.BUFFERING });
  }

  handlePlay() {
    this.setState({ playState: playStates.PLAYING });
  }

  handlePause() {
    this.setState({ playState: playStates.PAUSING });
  }

  handleStop() {
    this.setState({ playState: playStates.STOPPED });
  }

  handleMediaControlSeek(percentage) {
    this.playerRef.current.seekTo(percentage);
  }

  handleMediaControlTogglePlay() {
    this.setState(prevState => {
      switch (prevState.playState) {
        case playStates.INITIALIZING:
          return { playState: playStates.STOPPED };
        case playStates.BUFFERING:
          return { playState: playStates.BUFFERING };
        case playStates.PLAYING:
          return { playState: playStates.PAUSING };
        case playStates.PAUSING:
        case playStates.STOPPED:
          return { playState: playStates.PLAYING };
        default:
          throw new Error(`Invalid play state: ${prevState.playState}`);
      }
    });
  }

  handleProgress({ playedSeconds }) {
    this.setState({ playedSeconds });
  }

  handleDuration(durationInSeconds) {
    this.setState({ durationInSeconds });
  }

  handleVolumeChange(volume) {
    this.setState({ volume });
  }

  render() {
    const { content, clientSettings, githubFlavoredMarkdown } = this.props;
    const { playState, durationInSeconds, playedSeconds, volume } = this.state;
    const { parts, annotations, media } = content;
    const html = githubFlavoredMarkdown.render(media.text || '');
    const aspectRatio = media.aspectRatio || { h: 16, v: 9 };
    const paddingTop = `${(aspectRatio.v / aspectRatio.h * 100).toFixed(2)}%`;
    const width = content.width || 100;

    let url;
    switch (media.type) {
      case 'internal':
        url = media.url ? `${clientSettings.cdnRootUrl}/${media.url}` : null;
        break;
      default:
        url = media.url || null;
        break;
    }

    const mediaControlContainerClasses = classNames(['AnavisDisplay-mediaControlContainer', `u-width-${width}`]);

    const mediaControl = url && !(media.kind === 'video') ? (
      <div className={mediaControlContainerClasses}>
        <MediaControl
          isPlaying={playState === playStates.PLAYING}
          durationInSeconds={durationInSeconds}
          playedSeconds={playedSeconds}
          volume={volume}
          onSeek={this.handleMediaControlSeek}
          onTogglePlay={this.handleMediaControlTogglePlay}
          onVolumeChange={this.handleVolumeChange}
          />
      </div>
    ) : null;

    const containerInnerClasses = classNames({
      'Anavis-mainPlayerContainer': true,
      [`u-width-${width}`]: !!(media.kind === 'video'),
      'Anavis-mainPlayerContainer--noDisplay': !(media.kind === 'video')
    });

    const mainPlayer = (
      <div className={containerInnerClasses}>
        <div className="Anavis-mainPlayerOuter" style={{ paddingTop }}>
          <ReactPlayer
            ref={this.playerRef}
            className="Anavis-mainPlayerInner"
            url={url}
            width="100%"
            height="100%"
            controls
            volume={volume}
            progressInterval={100}
            playing={playState === playStates.PLAYING || playState === playStates.BUFFERING}
            onReady={this.handleReady}
            onBuffer={this.handleBuffer}
            onStart={this.handlePlay}
            onPlay={this.handlePlay}
            onPause={this.handlePause}
            onEnded={this.handleStop}
            onDuration={this.handleDuration}
            onProgress={this.handleProgress}
            />
        </div>
      </div>
    );

    const players = url ? (
      <div className="Anavis-players">
        {mainPlayer}
        {mediaControl}
      </div>
    ) : null;

    const text = html ? (
      <div className="Anavis-text" dangerouslySetInnerHTML={{ __html: html }} />
    ) : null;

    const partsComponents = parts.map((part, index) => (
      <div key={index.toString()} className="Anavis-partOuter" style={{ flex: `${part.length} 0 0%` }}>
        <div className="Anavis-partInner" style={{ color: colorHelper.getContrastColor(part.color), backgroundColor: part.color }} title={part.name}>
          <div className="Anavis-partName">{part.name}</div>
        </div>
      </div>
    ));

    return (
      <div className="Anavis">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', marginBottom: '25px' }}>
          <div className={`Anavis-parts u-width-${width}`}>
            {partsComponents}
          </div>
        </div>
        {players}
        {text}
      </div>
    );
  }
}

AnavisDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientSettingsProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  clientSettings: ClientSettings,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, AnavisDisplay);
