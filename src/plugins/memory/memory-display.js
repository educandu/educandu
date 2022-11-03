import classNames from 'classnames';
import { SIZE } from './constants.js';
import React, { useEffect, useState } from 'react';
import Markdown from '../../components/markdown.js';
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
    const reserveCentralSpace = size === SIZE.threeByThree && index === 4;

    if (reserveCentralSpace) {
      elementsToRender.push(<div key="emptyTile" />);
    }

    elementsToRender.push((
      <FlipCard
        key={tile.key}
        flipped={tile.key === flippedTile?.key}
        disabled={matchedTilePairKeys.includes(tile.pairKey)}
        frontContent={<Markdown>{tile.text}</Markdown>}
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
