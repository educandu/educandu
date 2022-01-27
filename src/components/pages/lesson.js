import { Button } from 'antd';
import PropTypes from 'prop-types';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { EditOutlined } from '@ant-design/icons';
import React, { Fragment, useState } from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { moveItem } from '../../utils/array-utils.js';
import { useDateFormat } from '../language-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import SectionsDisplayNew from '../sections-display-new.js';
import { EditControlPanel } from '../edit-control-panel.js';
import { lessonShape } from '../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import LessonApiClient from '../../api-clients/lesson-api-client.js';
import LessonMetadataModal, { LESSON_MODAL_MODE } from '../lesson-metadata-modal.js';

const logger = new Logger(import.meta.url);

function Lesson({ PageTemplate, initialState }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation();

  const isRoomOwner = user._id === initialState.roomOwner;
  const lessonApiClient = useSessionAwareApiClient(LessonApiClient);

  const [isInEditMode, setIsInEditMode] = useState(false);
  const [lesson, setLesson] = useState(initialState.lesson);
  const [currentSections, setCurrentSections] = useState(cloneDeep(lesson.sections));
  const [isLessonMetadataModalVisible, setIsLessonMetadataModalVisible] = useState(false);

  const handleEdit = () => new Promise(resolve => {
    setTimeout(() => {
      setIsInEditMode(true);
      setCurrentSections(cloneDeep(lesson.sections));
      resolve();
    }, 200);
  });

  const handleSave = async () => {
    try {
      const updatedLesson = await lessonApiClient.updateLessonSections({
        lessonId: lesson._id,
        sections: currentSections
      });

      setLesson(updatedLesson);
      setCurrentSections(cloneDeep(updatedLesson.sections));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleClose = () => {
    setIsInEditMode(false);
    setCurrentSections(cloneDeep(lesson.sections));
  };

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

  const handleSectionMoved = (sourceIndex, destinationIndex) => {
    const reorderedSections = moveItem(currentSections, sourceIndex, destinationIndex);
    setCurrentSections(reorderedSections);
  };

  return (
    <Fragment>
      <PageTemplate>
        <div className="Lesson">
          <SectionsDisplayNew
            sections={currentSections}
            canEdit={isInEditMode}
            onSectionMoved={handleSectionMoved}
            />
        </div>
      </PageTemplate>
      {isRoomOwner && (
        <Fragment>
          <EditControlPanel onEdit={handleEdit} onSave={handleSave} onClose={handleClose}>
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
