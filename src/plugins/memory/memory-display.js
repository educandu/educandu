import classNames from 'classnames';
import { SIZE } from './constants.js';
import MemoryTile from './memory-tile.js';
import React, { useEffect, useState } from 'react';
import FlipCard from '../../components/flip-card.js';
import { getRandomizedTilesFromPairs } from './memory-utils.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function MemoryDisplay({ content }) {
  const { size, tilePairs, width } = content;
  const [tiles, setTiles] = useState([]);
  const [flippedTile, setFlippedTile] = useState(null);
  const [matchedTilePairKeys, setMatchedTilePairKeys] = useState([]);

  useEffect(() => {
    setFlippedTile(null);
    setMatchedTilePairKeys([]);
    setTiles(getRandomizedTilesFromPairs(tilePairs));
  }, [tilePairs]);

  const mainClasses = classNames(
    'MemoryDisplay',
    `u-width-${width}`,
    { 'MemoryDisplay--3x3': size === SIZE.threeByThree },
    { 'MemoryDisplay--4x4': size === SIZE.fourByFour }
  );

  const handleTileClick = tile => {
    if (flippedTile?.key === tile.key) {
      setFlippedTile(null);
      return;
    }

    if (flippedTile?.pairKey === tile.pairKey) {
      setMatchedTilePairKeys(prevState => [...prevState, tile.pairKey]);
      setFlippedTile(null);
      return;
    }

    setFlippedTile(tile);
  };

  const renderTile = (tile, index) => {
    const elementsToRender = [];
    const isFlipped = tile.key === flippedTile?.key;
    const reserveCentralSpace = size === SIZE.threeByThree && index === 4;

    if (reserveCentralSpace) {
      elementsToRender.push(<div key="emptyTile" />);
    }

    elementsToRender.push((
      <FlipCard
        key={tile.key}
        flipped={isFlipped}
        disabled={matchedTilePairKeys.includes(tile.pairKey)}
        frontContent={(
          <MemoryTile text={tile.text} sourceUrl={tile.sourceUrl} isFlipped={isFlipped} />
        )}
        onClick={() => handleTileClick(tile)}
        />
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
