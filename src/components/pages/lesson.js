import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { lessonShape } from '../../ui/default-prop-types.js';

function Lesson({ PageTemplate, initialState }) {
  const { t } = useTranslation('lesson');

  const { lesson } = initialState;

  return (
    <PageTemplate>
      <div className="Lesson">
        <h1> {t('pageNames:lesson', { lessonTitle: lesson.title })}</h1>
      </div>
    </PageTemplate>);
}

Lesson.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    lesson: lessonShape.isRequired
  }).isRequired
};

export default Lesson;
