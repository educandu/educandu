import React from 'react';
import PropTypes from 'prop-types';
import { TYPE } from './constants.js';
import HintIcon from '../../components/icons/music-accentuation/hint-icon.js';
import MelodyIcon from '../../components/icons/music-accentuation/melody-icon.js';
import RhythmIcon from '../../components/icons/music-accentuation/rhythm-icon.js';
import HarmonyIcon from '../../components/icons/music-accentuation/harmony-icon.js';
import PlayingIcon from '../../components/icons/music-accentuation/playing-icon.js';
import ReadingIcon from '../../components/icons/music-accentuation/reading-icon.js';
import MovementIcon from '../../components/icons/music-accentuation/movement-icon.js';
import ResearchIcon from '../../components/icons/music-accentuation/research-icon.js';
import AssignmentIcon from '../../components/icons/music-accentuation/assignment-icon.js';
import StandardSolutionIcon from '../../components/icons/music-accentuation/standard-solution-icon.js';

function MusicAccentuationIconRenderer({ type, className }) {
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

MusicAccentuationIconRenderer.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string
};

MusicAccentuationIconRenderer.defaultProps = {
  className: null
};

export default MusicAccentuationIconRenderer;
