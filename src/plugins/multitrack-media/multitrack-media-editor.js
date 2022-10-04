import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import React, { Fragment, useRef } from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { Button, Form, Input, Tooltip } from 'antd';
import ItemPanel from '../../components/item-panel.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import TrackMixer from '../../components/media-player/track-mixer.js';
import { removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { createDefaultSecondaryTrack } from './multitrack-media-utils.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import SecondaryTrackEditor from '../../components/media-player/secondary-track-editor.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function MultitrackMediaEditor({ content, onContentChanged }) {
  const playerRef = useRef(null);
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('multitrackMedia');

  const { width, mainTrack, secondaryTracks } = content;
  const sources = {
    mainTrack: {
      name: mainTrack.name,
      sourceUrl: urlUtils.getMediaUrl({
        sourceUrl: mainTrack.sourceUrl,
        sourceType: mainTrack.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: mainTrack.volume,
      playbackRange: mainTrack.playbackRange
    },
    secondaryTracks: secondaryTracks.map(track => ({
      name: track.name,
      sourceUrl: urlUtils.getMediaUrl({
        sourceUrl: track.sourceUrl,
        sourceType: track.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: track.volume
    }))
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalid = false;
    onContentChanged(newContent, isInvalid);
  };

  const handleMainTrackNameChanged = event => {
    const { value } = event.target;
    changeContent({ mainTrack: { ...mainTrack, name: value } });
  };

  const handeSecondaryTrackContentChanged = (index, value) => {
    const newSecondaryTracks = cloneDeep(secondaryTracks);
    newSecondaryTracks[index] = value;
    changeContent({ secondaryTracks: newSecondaryTracks });
  };

  const handleMainTrackContentChanged = newMainTrackContent => {
    changeContent({ mainTrack: newMainTrackContent });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleMoveTrackUp = index => {
    changeContent({ secondaryTracks: swapItemsAt(secondaryTracks, index, index - 1) });
  };

  const handleMoveTrackDown = index => {
    changeContent({ secondaryTracks: swapItemsAt(secondaryTracks, index, index + 1) });
  };

  const handleDeleteTrack = index => {
    changeContent({ secondaryTracks: removeItemAt(secondaryTracks, index) });
  };

  const handleAddTrackButtonClick = () => {
    const newSecondaryTracks = secondaryTracks.slice();
    newSecondaryTracks.push(createDefaultSecondaryTrack(newSecondaryTracks.length, t));
    changeContent({ secondaryTracks: newSecondaryTracks });
  };

  const handleMainTrackSettingsChange = ({ volume }) => {
    changeContent({ mainTrack: { ...mainTrack, volume } });
  };

  const handleSecondaryTrackSettingsChange = (index, { volume }) => {
    const newSecondaryTracks = cloneDeep(secondaryTracks);
    newSecondaryTracks[index] = { ...secondaryTracks[index], volume };
    changeContent({ secondaryTracks: newSecondaryTracks });
  };

  return (
    <div className="MultitrackMediaEditor">
      <Form layout="horizontal">
        <ItemPanel header={t('common:mainTrack')}>
          <FormItem label={t('common:name')} {...formItemLayout}>
            <Input value={mainTrack?.name} onChange={handleMainTrackNameChanged} />
          </FormItem>
          <MainTrackEditor
            content={mainTrack}
            onContentChanged={handleMainTrackContentChanged}
            />
        </ItemPanel>

        {secondaryTracks.map((secondaryTrack, index) => (
          <ItemPanel
            index={index}
            collapsed
            key={index.toString()}
            itemsCount={secondaryTracks.length}
            header={t('common:secondaryTrack', { number: index + 2 })}
            onMoveUp={handleMoveTrackUp}
            onMoveDown={handleMoveTrackDown}
            onDelete={handleDeleteTrack}
            >
            <SecondaryTrackEditor
              content={secondaryTrack}
              onContentChanged={value => handeSecondaryTrackContentChanged(index, value)}
              />
          </ItemPanel>
        ))}
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTrackButtonClick}>
          {t('common:addTrack')}
        </Button>
        <ItemPanel header={t('common:trackMixer')}>
          <div className="MultitrackMediaEditor-trackMixerPreview">
            <MultitrackMediaPlayer
              sources={sources}
              aspectRatio={mainTrack.aspectRatio}
              screenMode={mainTrack.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
              mediaPlayerRef={playerRef}
              screenWidth={50}
              />
          </div>
          <TrackMixer
            mainTrack={sources.mainTrack}
            secondaryTracks={sources.secondaryTracks}
            onMainTrackSettingsChange={handleMainTrackSettingsChange}
            onSecondaryTrackSettingsChange={handleSecondaryTrackSettingsChange}
            />
        </ItemPanel>

        <FormItem
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...formItemLayout}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </FormItem>
      </Form>
    </div>
  );
}

MultitrackMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default MultitrackMediaEditor;
