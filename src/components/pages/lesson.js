import { Button } from 'antd';
import PropTypes from 'prop-types';
import { useUser } from '../user-context.js';
import { EditOutlined } from '@ant-design/icons';
import React, { Fragment, useState } from 'react';
import { useDateFormat } from '../language-context.js';
import { EditControlPanel } from '../edit-control-panel.js';
import { lessonShape } from '../../ui/default-prop-types.js';
import LessonMetadataModal, { LESSON_MODAL_MODE } from '../lesson-metadata-modal.js';

function Lesson({ PageTemplate, initialState }) {
  const user = useUser();
  const { formatDate } = useDateFormat();

  const isRoomOwner = user._id === initialState.roomOwner;
  const [lesson, setLesson] = useState(initialState.lesson);
  const [isLessonMetadataModalVisible, setIsLessonMetadataModalVisible] = useState(false);

  const loadScripts = () => new Promise(resolve => {
    setTimeout(resolve, 200);
  });

  const startsOn = lesson.schedule?.startsOn
    ? formatDate(lesson.schedule.startsOn)
    : '';

  const handleEditMetadataClick = () => {
    setIsLessonMetadataModalVisible(true);
  };

  const handleLessonMetadataModalSave = updatedLesson => {
    setLesson(prevState => ({
      ...prevState,
      title: updatedLesson.title,
      slug: updatedLesson.slug,
      language: updatedLesson.language,
      schedule: updatedLesson.schedule
    }));
  };

  const handleLessonMetadataModalClose = () => {
    setIsLessonMetadataModalVisible(false);
  };

  return (
    <Fragment>
      <PageTemplate>
        <div className="Lesson" />
      </PageTemplate>
      {isRoomOwner && (
        <Fragment>
          <EditControlPanel onEdit={() => loadScripts()}>
            <span className="Lesson-editControlPanelItem">
              <Button size="small" icon={<EditOutlined />} onClick={handleEditMetadataClick} ghost />
            </span>
            <span className="Lesson-editControlPanelItem">{startsOn}</span>
            <span className="Lesson-editControlPanelItem">{lesson.title}</span>
          </EditControlPanel>

          <LessonMetadataModal
            lesson={lesson}
            mode={LESSON_MODAL_MODE.update}
            isVisible={isLessonMetadataModalVisible}
            onSave={handleLessonMetadataModalSave}
            onClose={handleLessonMetadataModalClose}
            />
        </Fragment>
      )}
    </Fragment>
  );
}

Lesson.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    lesson: lessonShape.isRequired,
    roomOwner: PropTypes.string.isRequired
  }).isRequired
};

export default Lesson;
