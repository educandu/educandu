import { Button } from 'antd';
import PropTypes from 'prop-types';
import DocView from '../doc-view.js';
import React, { Fragment } from 'react';
import { EditOutlined } from '@ant-design/icons';
import { useDateFormat } from '../language-context.js';
import { EditControlPanel } from '../edit-control-panel.js';
import { lessonShape } from '../../ui/default-prop-types.js';

function Lesson({ PageTemplate, initialState }) {
  const { formatDate } = useDateFormat();

  const { lesson } = initialState;

  const loadScripts = () => new Promise(resolve => {
    setTimeout(resolve, 200);
  });

  const startsOn = lesson.schedule?.startsOn
    ? formatDate(lesson.schedule.startsOn)
    : '';

  const handleEditMetadataClick = () => {
    // Show edit dialog here!
  };

  return (
    <Fragment>
      <PageTemplate>
        <div className="Lesson">
          <DocView documentOrRevision={lesson} />
        </div>
      </PageTemplate>
      <EditControlPanel onEdit={() => loadScripts()}>
        <span className="Lesson-editControlPanelItem">
          <Button size="small" icon={<EditOutlined />} onClick={handleEditMetadataClick} ghost />
        </span>
        <span className="Lesson-editControlPanelItem">{startsOn}</span>
        <span className="Lesson-editControlPanelItem">{lesson.title}</span>
      </EditControlPanel>
    </Fragment>
  );
}

Lesson.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    lesson: lessonShape.isRequired
  }).isRequired
};

export default Lesson;
