import memoizee from 'memoizee';
import { Breadcrumb } from 'antd';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../utils/unique-id.js';
import React, { Fragment, useState } from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import { useDateFormat } from '../language-context.js';
import InfoFactory from '../../plugins/info-factory.js';
import { handleApiError } from '../../ui/error-helper.js';
import EditorFactory from '../../plugins/editor-factory.js';
import SectionsDisplayNew from '../sections-display-new.js';
import { GlobalOutlined, LockOutlined } from '@ant-design/icons';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import LessonApiClient from '../../api-clients/lesson-api-client.js';
import { lessonShape, roomShape } from '../../ui/default-prop-types.js';
import { LESSON_VIEW, ROOM_ACCESS_LEVEL } from '../../domain/constants.js';
import LessonMetadataModal, { LESSON_MODAL_MODE } from '../lesson-metadata-modal.js';
import EditControlPanel, { EDIT_CONTROL_PANEL_STATUS } from '../edit-control-panel.js';
import { confirmDiscardUnsavedChanges, confirmSectionDelete } from '../confirmation-dialogs.js';
import {
  ensureIsExcluded,
  ensureIsIncluded,
  insertItemAt,
  moveItem,
  removeItemAt,
  replaceItemAt
} from '../../utils/array-utils.js';

const logger = new Logger(import.meta.url);

const ensureEditorsAreLoaded = memoizee(editorFactory => editorFactory.ensureEditorsAreLoaded());

function Lesson({ PageTemplate, initialState }) {
  const user = useUser();
  const request = useRequest();
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const infoFactory = useService(InfoFactory);
  const editorFactory = useService(EditorFactory);

  const startsInEditMode = request.query.view === LESSON_VIEW.edit;

  const { room } = initialState;
  const isRoomOwner = user?._id === room.owner._id;
  const lessonApiClient = useSessionAwareApiClient(LessonApiClient);

  const [isDirty, setIsDirty] = useState(false);
  const [lesson, setLesson] = useState(initialState.lesson);
  const [invalidSectionKeys, setInvalidSectionKeys] = useState([]);
  const [isInEditMode, setIsInEditMode] = useState(startsInEditMode);
  const [currentSections, setCurrentSections] = useState(cloneDeep(lesson.sections));
  const [isLessonMetadataModalVisible, setIsLessonMetadataModalVisible] = useState(false);

  const handleMetadataEdit = () => {
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

  const handleEdit = async () => {
    await ensureEditorsAreLoaded(editorFactory);
    setIsInEditMode(true);
    setCurrentSections(cloneDeep(lesson.sections));

    history.replaceState(null, '', urls.getLessonUrl({ id: lesson._id, slug: lesson.slug, view: LESSON_VIEW.edit }));
  };

  const handleSave = async () => {
    try {
      const updatedLesson = await lessonApiClient.updateLessonSections({
        lessonId: lesson._id,
        sections: currentSections
      });

      setIsDirty(false);
      setLesson(updatedLesson);
      setCurrentSections(cloneDeep(updatedLesson.sections));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleClose = () => {
    return new Promise(resolve => {
      const exitEditMode = () => {
        setIsDirty(false);
        setIsInEditMode(false);
        setInvalidSectionKeys([]);
        setCurrentSections(cloneDeep(lesson.sections));

        history.replaceState(null, '', urls.getLessonUrl({ id: lesson._id, slug: lesson.slug }));

        resolve(true);
      };

      if (isDirty) {
        confirmDiscardUnsavedChanges(t, exitEditMode, () => resolve(false));
      } else {
        exitEditMode();
      }
    });
  };

  const handleSectionContentChange = (index, newContent, isInvalid) => {
    const modifiedSection = {
      ...currentSections[index],
      content: newContent
    };

    const newSections = replaceItemAt(currentSections, modifiedSection, index);
    setCurrentSections(newSections);
    setInvalidSectionKeys(keys => isInvalid ? ensureIsIncluded(keys, modifiedSection.key) : ensureIsExcluded(keys, modifiedSection.key));
    setIsDirty(true);
  };

  const handleSectionMoved = (sourceIndex, destinationIndex) => {
    const reorderedSections = moveItem(currentSections, sourceIndex, destinationIndex);
    setCurrentSections(reorderedSections);
    setIsDirty(true);
  };

  const handleSectionInserted = (pluginType, index) => {
    const pluginInfo = infoFactory.createInfo(pluginType);
    const newSection = {
      key: uniqueId.create(),
      type: pluginType,
      content: pluginInfo.getDefaultContent(t)
    };
    const newSections = insertItemAt(currentSections, newSection, index);
    setCurrentSections(newSections);
    setIsDirty(true);
  };

  const handleSectionDuplicated = index => {
    const originalSection = currentSections[index];
    const duplicatedSection = cloneDeep(originalSection);
    duplicatedSection.key = uniqueId.create();

    const expandedSections = insertItemAt(currentSections, duplicatedSection, index + 1);
    setCurrentSections(expandedSections);
    setIsDirty(true);
    if (invalidSectionKeys.includes(originalSection.key)) {
      setInvalidSectionKeys(keys => ensureIsIncluded(keys, duplicatedSection.key));
    }
  };

  const handleSectionDeleted = index => {
    confirmSectionDelete(
      t,
      () => {
        const section = currentSections[index];
        const reducedSections = removeItemAt(currentSections, index);
        setInvalidSectionKeys(keys => ensureIsExcluded(keys, section.key));
        setCurrentSections(reducedSections);
        setIsDirty(true);
      }
    );
  };

  let controlStatus;
  if (invalidSectionKeys.length) {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.invalid;
  } else if (isDirty) {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.dirty;
  } else {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.saved;
  }

  const startsOn = lesson.schedule?.startsOn
    ? formatDate(lesson.schedule.startsOn)
    : '';

  return (
    <Fragment>
      <PageTemplate>
        <div className="LessonPage">
          <div className="LessonPage-breadcrumbs">
            <Breadcrumb>
              <Breadcrumb.Item href={urls.getRoomUrl(room._id, room.slug)}>
                {room.access === ROOM_ACCESS_LEVEL.private ? <LockOutlined /> : <GlobalOutlined />}
                <span>{room.name}</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>{lesson.title}</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          <SectionsDisplayNew
            sections={currentSections}
            sectionsContainerId={lesson._id}
            canEdit={isInEditMode}
            onSectionContentChange={handleSectionContentChange}
            onSectionMoved={handleSectionMoved}
            onSectionInserted={handleSectionInserted}
            onSectionDuplicated={handleSectionDuplicated}
            onSectionDeleted={handleSectionDeleted}
            />
        </div>
      </PageTemplate>
      {isRoomOwner && (
        <Fragment>
          <EditControlPanel
            canClose
            canCancel={false}
            startExpanded={startsInEditMode}
            onEdit={handleEdit}
            onMetadataEdit={handleMetadataEdit}
            onSave={handleSave}
            onClose={handleClose}
            status={controlStatus}
            metadata={(
              <Fragment >
                <span className="LessonPage-editControlPanelItem">{startsOn}</span>
                <span className="LessonPage-editControlPanelItem">{lesson.title}</span>
              </Fragment>
            )}
            />

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
    room: roomShape.isRequired
  }).isRequired
};

export default Lesson;
