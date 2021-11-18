import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import reactPlayerNs from 'react-player';
import colorHelper from '../../../ui/color-helper.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import MediaControl from '../../../components/media-control.js';
import { inject } from '../../../components/container-context.js';
import { MEDIA_KIND, MEDIA_TYPE, PLAY_STATE } from '../constants.js';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown.js';
import { sectionDisplayProps, clientConfigProps } from '../../../ui/default-prop-types.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

class AnavisDisplay extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.playerRef = React.createRef();
    this.state = {
      playState: PLAY_STATE.initializing,
      durationInSeconds: 0,
      playedSeconds: 0,
      volume: 1
    };
  }

  handleReady() {
    this.setState({ playState: PLAY_STATE.stopped });
  }

  handleBuffer() {
    this.setState({ playState: PLAY_STATE.buffering });
  }

  handlePlay() {
    this.setState({ playState: PLAY_STATE.playing });
  }

  handlePause() {
    this.setState({ playState: PLAY_STATE.pausing });
  }

  handleStop() {
    this.setState({ playState: PLAY_STATE.stopped });
  }

  handleMediaControlSeek(percentage) {
    this.playerRef.current.seekTo(percentage);
  }

  handleMediaControlTogglePlay() {
    this.setState(prevState => {
      switch (prevState.playState) {
        case PLAY_STATE.initializing:
          return { playState: PLAY_STATE.stopped };
        case PLAY_STATE.buffering:
          return { playState: PLAY_STATE.buffering };
        case PLAY_STATE.playing:
          return { playState: PLAY_STATE.pausing };
        case PLAY_STATE.pausing:
        case PLAY_STATE.stopped:
          return { playState: PLAY_STATE.playing };
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
    const { content, clientConfig, githubFlavoredMarkdown } = this.props;
    const { playState, durationInSeconds, playedSeconds, volume } = this.state;
    const { parts, media } = content;
    const html = githubFlavoredMarkdown.render(media.text || '');
    const aspectRatio = media.aspectRatio || { h: 16, v: 9 };
    const paddingTop = `${(aspectRatio.v / aspectRatio.h * 100).toFixed(2)}%`;
    const width = content.width || 100;

    let url;
    switch (media.type) {
      case MEDIA_TYPE.internal:
        url = media.url ? `${clientConfig.cdnRootUrl}/${media.url}` : null;
        break;
      default:
        url = media.url || null;
        break;
    }

    const mediaControlContainerClasses = classNames(['AnavisDisplay-mediaControlContainer', `u-width-${width}`]);

    const mediaControl = url && !(media.kind === MEDIA_KIND.video)
      ? (
        <div className={mediaControlContainerClasses}>
          <MediaControl
            isPlaying={playState === PLAY_STATE.playing}
            durationInSeconds={durationInSeconds}
            playedSeconds={playedSeconds}
            volume={volume}
            onSeek={this.handleMediaControlSeek}
            onTogglePlay={this.handleMediaControlTogglePlay}
            onVolumeChange={this.handleVolumeChange}
            />
        </div>
      )
      : null;

    const containerInnerClasses = classNames({
      'Anavis-mainPlayerContainer': true,
      [`u-width-${width}`]: !!(media.kind === MEDIA_KIND.video),
      'Anavis-mainPlayerContainer--noDisplay': !(media.kind === MEDIA_KIND.video)
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
            playing={playState === PLAY_STATE.playing || playState === PLAY_STATE.buffering}
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

    const players = url
      ? (
        <div className="Anavis-players">
          {mainPlayer}
          {mediaControl}
        </div>
      )
      : null;

    const text = html
      ? (
        <div className="Anavis-text" dangerouslySetInnerHTML={{ __html: html }} />
      )
      : null;

    const partsComponents = parts.map((part, index) => (
      <div key={index.toString()} className="Anavis-partOuter" style={{ flex: `${part.length} 0 0%` }}>
        <div className="Anavis-partInner" style={{ color: colorHelper.getContrastColor(part.color), backgroundColor: part.color }} title={part.name}>
          <div className="Anavis-partName">{part.name}</div>
        </div>
      </div>
    ));

    const annotationCount = parts.reduce((maxCount, part) => Math.max(maxCount, part.annotations.length), 0);

    const annotationComponents = Array.from({ length: annotationCount }, (item, index) => index).map((item, annotationIndex) => (
      <div key={annotationIndex.toString()} className="Anavis-annotation">
        {parts.map((part, partIndex) => (
          <div
            key={partIndex.toString()}
            className="Anavis-annotationItem"
            title={part.annotations[annotationIndex]}
            style={{ flex: `${part.length} 0 0%` }}
            >
            <div className="Anavis-annotationItemText">
              {part.annotations[annotationIndex]}
            </div>
          </div>
        ))}
      </div>
    ));

    return (
      <div className="Anavis">
        <div className="Anavis-row">
          <div className={`Anavis-parts u-width-${width}`}>
            {partsComponents}
          </div>
        </div>
        <div className="Anavis-row">
          <div className={`Anavis-annotations u-width-${width}`}>
            {annotationComponents}
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
  ...clientConfigProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

export default inject({
  clientConfig: ClientConfig,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, AnavisDisplay);
