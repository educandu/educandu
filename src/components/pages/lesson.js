import memoizee from 'memoizee';
import { Breadcrumb } from 'antd';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import SectionsDisplay from '../sections-display.js';
import { useDateFormat } from '../locale-context.js';
import InfoFactory from '../../plugins/info-factory.js';
import { handleApiError } from '../../ui/error-helper.js';
import EditorFactory from '../../plugins/editor-factory.js';
import React, { Fragment, useEffect, useState } from 'react';
import { GlobalOutlined, LockOutlined } from '@ant-design/icons';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import LessonApiClient from '../../api-clients/lesson-api-client.js';
import { lessonShape, roomShape } from '../../ui/default-prop-types.js';
import LessonMetadataModal, { LESSON_MODAL_MODE } from '../lesson-metadata-modal.js';
import { LESSON_VIEW_QUERY_PARAM, ROOM_ACCESS_LEVEL } from '../../domain/constants.js';
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

  const startsInEditMode = request.query.view === LESSON_VIEW_QUERY_PARAM.edit;

  const { room } = initialState;
  const isRoomOwner = user?._id === room.owner._id;
  const lessonApiClient = useSessionAwareApiClient(LessonApiClient);

  const [isDirty, setIsDirty] = useState(false);
  const [lesson, setLesson] = useState(initialState.lesson);
  const [invalidSectionKeys, setInvalidSectionKeys] = useState([]);
  const [isInEditMode, setIsInEditMode] = useState(startsInEditMode);
  const [currentSections, setCurrentSections] = useState(cloneDeep(lesson.sections));
  const [isLessonMetadataModalVisible, setIsLessonMetadataModalVisible] = useState(false);

  useEffect(() => {
    if (startsInEditMode) {
      ensureEditorsAreLoaded(editorFactory);
    }
  }, [startsInEditMode, editorFactory]);

  useEffect(() => {
    if (isInEditMode) {
      history.replaceState(null, '', urls.getLessonUrl({ id: lesson._id, slug: lesson.slug, view: LESSON_VIEW_QUERY_PARAM.edit }));
    } else {
      history.replaceState(null, '', urls.getLessonUrl({ id: lesson._id, slug: lesson.slug }));
    }
  }, [isInEditMode, lesson._id, lesson.slug]);

  const handleEditMetadataOpen = () => {
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
    setIsLessonMetadataModalVisible(false);
  };

  const handleLessonMetadataModalCancel = () => {
    setIsLessonMetadataModalVisible(false);
  };

  const handleEditOpen = async () => {
    await ensureEditorsAreLoaded(editorFactory);
    setIsInEditMode(true);
    setCurrentSections(cloneDeep(lesson.sections));
  };

  const handleEditSave = async () => {
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

  const handleEditClose = () => {
    return new Promise(resolve => {
      const exitEditMode = () => {
        setIsDirty(false);
        setIsInEditMode(false);
        setInvalidSectionKeys([]);
        setCurrentSections(cloneDeep(lesson.sections));
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

  const handleSectionMove = (sourceIndex, destinationIndex) => {
    const reorderedSections = moveItem(currentSections, sourceIndex, destinationIndex);
    setCurrentSections(reorderedSections);
    setIsDirty(true);
  };

  const handleSectionInsert = (pluginType, index) => {
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

  const handleSectionDuplicate = index => {
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

  const handleSectionDelete = index => {
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
          <SectionsDisplay
            sections={currentSections}
            sectionsContainerId={lesson._id}
            canEdit={isInEditMode}
            onSectionContentChange={handleSectionContentChange}
            onSectionMove={handleSectionMove}
            onSectionInsert={handleSectionInsert}
            onSectionDuplicate={handleSectionDuplicate}
            onSectionDelete={handleSectionDelete}
            />
        </div>
      </PageTemplate>
      {isRoomOwner && (
        <Fragment>
          <EditControlPanel
            canClose
            canCancel={false}
            startOpen={startsInEditMode}
            onOpen={handleEditOpen}
            onMetadataOpen={handleEditMetadataOpen}
            onSave={handleEditSave}
            onClose={handleEditClose}
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
            onCancel={handleLessonMetadataModalCancel}
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
