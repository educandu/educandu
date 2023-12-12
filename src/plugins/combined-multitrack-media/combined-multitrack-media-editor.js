import React from 'react';
import { Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import ItemPanel from '../../components/item-panel.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import TrackEditor from '../../components/media-player/track-editor.js';
import WarningIcon from '../../components/icons/general/warning-icon.js';
import PlayerSettingsEditor from '../../components/media-player/player-settings-editor.js';

function CombinedMultitrackMediaEditor({ content, onContentChanged }) {
  const { t } = useTranslation('combinedMultitrackMedia');

  const { player1, width } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handlePlayer1TrackContentChange = newTrack => {
    changeContent({ player1: { ...player1, track: newTrack } });
  };

  const handlePlayer1SettingsContentChange = newSettings => {
    changeContent({ player1: { ...player1, ...newSettings } });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  return (
    <div className="MultitrackMediaEditor">
      <Form layout="horizontal" labelAlign="left">
        <div className="MultitrackMediaEditor-warning">
          <WarningIcon className="MultitrackMediaEditor-warningIcon" />
          {t('common:playerNotSupportedOnIOS')}
        </div>

        <ItemPanel header={t('playerNumber', { number: 1 })}>
          <TrackEditor
            content={player1.track}
            useName={false}
            onContentChange={handlePlayer1TrackContentChange}
            />
          <PlayerSettingsEditor
            content={player1}
            useWidth={false}
            onContentChange={handlePlayer1SettingsContentChange}
            />
        </ItemPanel>

        <ItemPanel header={t('playerNumber', { number: 2 })}>
          player2
        </ItemPanel>

        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </Form.Item>
      </Form>
    </div>
  );
}

CombinedMultitrackMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default CombinedMultitrackMediaEditor;
