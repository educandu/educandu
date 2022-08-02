import React from 'react';
import { useTranslation } from 'react-i18next';
import ItemPanel from '../../components/item-panel.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

function MultitrackMediaEditor({ content }) {
  const { secondaryTracks } = content;
  const { t } = useTranslation('multitrackMedia');

  const handleMoveTrackUp = () => {};
  const handleMoveTrackDown = () => {};
  const handleDeleteTrack = () => {};

  return (
    <div className="MultitrackMediaEditor">
      <ItemPanel header={t('mainTrack')} />
      {secondaryTracks.map((secondaryTrack, index) => (
        <ItemPanel
          index={index}
          key={index.toString()}
          itemsCount={secondaryTrack.length}
          header={t('secondaryTrack', { number: index + 1 })}
          onMoveUp={handleMoveTrackUp}
          onMoveDown={handleMoveTrackDown}
          onDelete={handleDeleteTrack}
          />
      ))}
    </div>
  );
}

MultitrackMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default MultitrackMediaEditor;
