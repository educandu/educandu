import React from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import ItemPanel from '../../components/item-panel.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import { createDefaultSecondaryTrack } from './multitrack-media-utils.js';

function MultitrackMediaEditor({ content, onContentChanged }) {
  const { secondaryTracks } = content;
  const { t } = useTranslation('multitrackMedia');

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalid = false;
    onContentChanged(newContent, isInvalid);
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

  return (
    <div className="MultitrackMediaEditor">
      <ItemPanel header={t('mainTrack')}>
        Main track
      </ItemPanel>

      {secondaryTracks.map((secondaryTrack, index) => (
        <ItemPanel
          index={index}
          key={index.toString()}
          itemsCount={secondaryTracks.length}
          header={t('secondaryTrack', { number: index + 1 })}
          onMoveUp={handleMoveTrackUp}
          onMoveDown={handleMoveTrackDown}
          onDelete={handleDeleteTrack}
          >
          {secondaryTrack.name}
        </ItemPanel>
      ))}
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTrackButtonClick}>
        {t('addTrack')}
      </Button>
      <ItemPanel header={t('trackMixer')}>
        Track mixer
      </ItemPanel>
    </div>
  );
}

MultitrackMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default MultitrackMediaEditor;
