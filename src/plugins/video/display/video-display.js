import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactPlayer from 'react-player';
import MediaControl from '../../../components/media-control';
import { inject } from '../../../components/container-context';
import ClientSettings from '../../../bootstrap/client-settings';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown';
import { sectionDisplayProps, clientSettingsProps } from '../../../ui/default-prop-types';

const playStates = {
  INITIALIZING: 'initializing',
  BUFFERING: 'buffering',
  STOPPED: 'stopped',
  PLAYING: 'playing',
  PAUSING: 'pausing'
};

class VideoDisplay extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
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
    const html = githubFlavoredMarkdown.render(content.text || '');
    const aspectRatio = content.aspectRatio || { h: 16, v: 9 };
    const paddingTop = `${(aspectRatio.v / aspectRatio.h * 100).toFixed(2)}%`;
    const width = content.width || 100;

    let url;
    switch (content.type) {
      case 'internal':
        url = content.url ? `${clientSettings.cdnRootUrl}/${content.url}` : null;
        break;
      default:
        url = content.url || null;
        break;
    }

    const mediaControlContainerClasses = classNames(['VideoDisplay-mediaControlContainer', `u-width-${width}`]);

    const mediaControl = url && !content.showVideo ? (
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
      'Video-mainPlayerContainer': true,
      [`u-width-${width}`]: !!content.showVideo,
      'Video-mainPlayerContainer--noDisplay': !content.showVideo
    });

    const mainPlayer = (
      <div className={containerInnerClasses}>
        <div className="Video-mainPlayerOuter" style={{ paddingTop }}>
          <ReactPlayer
            ref={this.playerRef}
            className="Video-mainPlayerInner"
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
      <div className="Video-players">
        {mainPlayer}
        {mediaControl}
      </div>
    ) : null;

    const text = html ? (
      <div className="Video-text" dangerouslySetInnerHTML={{ __html: html }} />
    ) : null;

    return (
      <div className="Video">
        {players}
        {text}
      </div>
    );
  }
}

VideoDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientSettingsProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

export default inject({
  clientSettings: ClientSettings,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, VideoDisplay);
