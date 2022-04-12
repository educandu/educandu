import memoizee from 'memoizee';
import { Breadcrumb } from 'antd';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import FavoriteStar from '../favorite-star.js';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../utils/unique-id.js';
import MetadataTitle from '../metadata-title.js';
import cloneDeep from '../../utils/clone-deep.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import SectionsDisplay from '../sections-display.js';
import { useDateFormat } from '../locale-context.js';
import InfoFactory from '../../plugins/info-factory.js';
import PublicIcon from '../icons/general/public-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import PrivateIcon from '../icons/general/private-icon.js';
import EditorFactory from '../../plugins/editor-factory.js';
import React, { Fragment, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import LessonApiClient from '../../api-clients/lesson-api-client.js';
import LessonMetadataModal, { LESSON_MODAL_MODE } from '../lesson-metadata-modal.js';
import EditControlPanel, { EDIT_CONTROL_PANEL_STATUS } from '../edit-control-panel.js';
import { lessonSectionShape, lessonShape, roomShape } from '../../ui/default-prop-types.js';
import { confirmDiscardUnsavedChanges, confirmSectionDelete } from '../confirmation-dialogs.js';
import { FAVORITE_TYPE, LESSON_VIEW_QUERY_PARAM, ROOM_ACCESS_LEVEL, ROOM_LESSONS_MODE } from '../../domain/constants.js';
import { ensureIsExcluded, ensureIsIncluded, insertItemAt, moveItem, removeItemAt, replaceItemAt } from '../../utils/array-utils.js';

const logger = new Logger(import.meta.url);

const ensureEditorsAreLoaded = memoizee(editorFactory => editorFactory.ensureEditorsAreLoaded());

const createPageAlerts = (isInEditMode, hasPendingTemplateSectionKeys, t) => {
  return isInEditMode && hasPendingTemplateSectionKeys ? [{ message: t('common:proposedSectionsAlert') }] : [];
};

function Lesson({ PageTemplate, initialState }) {
  const user = useUser();
  const request = useRequest();
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const infoFactory = useService(InfoFactory);
  const editorFactory = useService(EditorFactory);

  const startsInEditMode = request.query.view === LESSON_VIEW_QUERY_PARAM.edit;

  const { room } = initialState;
  const lessonApiClient = useSessionAwareApiClient(LessonApiClient);
  const isRoomOwner = user?._id === room.owner.key;
  const isRoomCollaborator = room.lessonsMode === ROOM_LESSONS_MODE.collaborative && room.members.find(m => m.userId === user?._id);

  const [isDirty, setIsDirty] = useState(false);
  const [lesson, setLesson] = useState(initialState.lesson);
  const [invalidSectionKeys, setInvalidSectionKeys] = useState([]);
  const [isInEditMode, setIsInEditMode] = useState(user ? startsInEditMode : false);
  const [pendingTemplateSectionKeys, setPendingTemplateSectionKeys] = useState((initialState.templateSections || []).map(s => s.key));
  const [currentSections, setCurrentSections] = useState(cloneDeep(initialState.templateSections?.length ? initialState.templateSections : lesson.sections));
  const [isLessonMetadataModalVisible, setIsLessonMetadataModalVisible] = useState(false);

  const [alerts, setAlerts] = useState(createPageAlerts(isInEditMode, !!pendingTemplateSectionKeys.length, t));
  useEffect(() => {
    setAlerts(createPageAlerts(isInEditMode, !!pendingTemplateSectionKeys.length, t));
  }, [isInEditMode, pendingTemplateSectionKeys, t]);

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
        sections: currentSections.filter(s => !pendingTemplateSectionKeys.includes(s.key))
      });

      const currentSectionKeys = currentSections.map(s => s.key);
      if (updatedLesson.sections.some(s => !currentSectionKeys.includes(s.key))) {
        throw new Error('Updated sections do not match existing sections');
      }

      const newPendingTemplateSectionKeys = [];
      const mergedSections = currentSections.map(currentSection => {
        const updatedSection = updatedLesson.sections.find(s => s.key === currentSection.key);
        if (updatedSection) {
          return updatedSection;
        }

        newPendingTemplateSectionKeys.push(currentSection.key);
        return currentSection;
      });

      setIsDirty(false);
      setLesson(updatedLesson);
      setCurrentSections(cloneDeep(mergedSections));
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

  const handlePendingSectionApply = index => {
    const appliedSectionKey = currentSections[index].key;
    setPendingTemplateSectionKeys(prevKeys => ensureIsExcluded(prevKeys, appliedSectionKey));
    setIsDirty(true);
  };

  const handlePendingSectionDiscard = index => {
    const discardedSection = currentSections[index];
    setCurrentSections(prevSections => ensureIsExcluded(prevSections, discardedSection));
    setIsDirty(true);
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

  const isPrivateRoom = room.access === ROOM_ACCESS_LEVEL.private;

  const publicStorage = {
    rootPath: 'media',
    initialPath: `media/${lesson._id}`,
    uploadPath: `media/${lesson._id}`
  };

  const privateStorage = isPrivateRoom && !!user.storage.plan
    ? {
      rootPath: `rooms/${room._id}/media`,
      initialPath: `rooms/${room._id}/media`,
      uploadPath: `rooms/${room._id}/media`
    }
    : null;

  return (
    <Fragment>
      <PageTemplate alerts={alerts}>
        <div className="LessonPage">
          <Breadcrumb className="Breadcrumbs">
            <Breadcrumb.Item href={urls.getRoomUrl(room._id, room.slug)}>
              {isPrivateRoom ? <PrivateIcon /> : <PublicIcon />}
              <span>{room.name}</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{lesson.title}</Breadcrumb.Item>
          </Breadcrumb>
          <MetadataTitle
            text={lesson.title}
            extra={<FavoriteStar type={FAVORITE_TYPE.lesson} id={lesson._id} />}
            />
          <SectionsDisplay
            sections={currentSections}
            pendingSectionKeys={pendingTemplateSectionKeys}
            publicStorage={publicStorage}
            privateStorage={privateStorage}
            canEdit={isInEditMode}
            onPendingSectionApply={handlePendingSectionApply}
            onPendingSectionDiscard={handlePendingSectionDiscard}
            onSectionContentChange={handleSectionContentChange}
            onSectionMove={handleSectionMove}
            onSectionInsert={handleSectionInsert}
            onSectionDuplicate={handleSectionDuplicate}
            onSectionDelete={handleSectionDelete}
            />
        </div>
      </PageTemplate>
      {(isRoomOwner || isRoomCollaborator) && (
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
            initialLessonMetadata={lesson}
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
    templateSections: PropTypes.arrayOf(lessonSectionShape),
    room: roomShape.isRequired
  }).isRequired
};

export default Lesson;
