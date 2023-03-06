import React from 'react';
import PropTypes from 'prop-types';
import { TYPE } from './constants.js';
import HintIcon from '../../components/icons/music-learning-block/hint-icon.js';
import MelodyIcon from '../../components/icons/music-learning-block/melody-icon.js';
import RhythmIcon from '../../components/icons/music-learning-block/rhythm-icon.js';
import HarmonyIcon from '../../components/icons/music-learning-block/harmony-icon.js';
import PlayingIcon from '../../components/icons/music-learning-block/playing-icon.js';
import ReadingIcon from '../../components/icons/music-learning-block/reading-icon.js';
import MovementIcon from '../../components/icons/music-learning-block/movement-icon.js';
import ResearchIcon from '../../components/icons/music-learning-block/research-icon.js';
import AssignmentIcon from '../../components/icons/music-learning-block/assignment-icon.js';
import StandardSolutionIcon from '../../components/icons/music-learning-block/standard-solution-icon.js';

function MusicLearningBlockIconRenderer({ type, className }) {
  switch (type) {
    case TYPE.assignment:
      return <div className={className}><AssignmentIcon /></div>;
    case TYPE.harmony:
      return <div className={className}><HarmonyIcon /></div>;
    case TYPE.hint:
      return <div className={className}><HintIcon /></div>;
    case TYPE.melody:
      return <div className={className}><MelodyIcon /></div>;
    case TYPE.movement:
      return <div className={className}><MovementIcon /></div>;
    case TYPE.playing:
      return <div className={className}><PlayingIcon /></div>;
    case TYPE.reading:
      return <div className={className}><ReadingIcon /></div>;
    case TYPE.research:
      return <div className={className}><ResearchIcon /></div>;
    case TYPE.rhythm:
      return <div className={className}><RhythmIcon /></div>;
    case TYPE.standardSolution:
      return <div className={className}><StandardSolutionIcon /></div>;
    default:
      return null;
  }
}

MusicLearningBlockIconRenderer.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string
};

MusicLearningBlockIconRenderer.defaultProps = {
  className: null
};

export default MusicLearningBlockIconRenderer;
