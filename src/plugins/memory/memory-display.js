import classNames from 'classnames';
import { SIZE } from './constants.js';
import React, { useEffect, useState } from 'react';
import Markdown from '../../components/markdown.js';
import { getRandomizedTilesFromPairs } from './memory-utils.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function MemoryDisplay({ content }) {
  const { size, tilePairs, width } = content;
  const [tiles, setTiles] = useState([]);

  useEffect(() => {
    setTiles(getRandomizedTilesFromPairs(tilePairs));
  }, [tilePairs]);

  const mainClasses = classNames(
    'MemoryDisplay',
    `u-width-${width}`,
    { 'MemoryDisplay--3x3': size === SIZE.threeByThree },
    { 'MemoryDisplay--4x4': size === SIZE.fourByFour }
  );

  const renderTile = (tile, index) => {
    const reserveCentralSpace = size === SIZE.threeByThree && index === 4;
    const elementsToRender = [];

    if (reserveCentralSpace) {
      elementsToRender.push((
        <div key="emptyTile" className="MemoryDisplay-tile--empty" />
      ));
    }

    elementsToRender.push((
      <div key={index} className="MemoryDisplay-tile">
        <div className="MemoryDisplay-tileContent">
          <Markdown>{tile.text}</Markdown>
        </div>
      </div>
    ));

    return elementsToRender;
  };

  return (
    <div className={mainClasses}>
      {tiles.map(renderTile)}
    </div>
  );
}

MemoryDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MemoryDisplay;
