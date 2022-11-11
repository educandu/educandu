import classNames from 'classnames';
import { SIZE } from './constants.js';
import MemoryTile from './memory-tile.js';
import FlipCard from '../../components/flip-card.js';
import React, { useEffect, useRef, useState } from 'react';
import { getRandomizedTilesFromPairs } from './memory-utils.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function MemoryDisplay({ content }) {
  const { size, tilePairs, width } = content;

  const isMounted = useRef(false);
  const [tiles, setTiles] = useState([]);
  const [matchedTilePairKeys, setMatchedTilePairKeys] = useState([]);
  const [currentlyFlippedTiles, setCurrentlyFlippedTiles] = useState([]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setMatchedTilePairKeys([]);
    setCurrentlyFlippedTiles([]);
    setTiles(getRandomizedTilesFromPairs(tilePairs));
  }, [tilePairs]);

  const mainClasses = classNames(
    'MemoryDisplay',
    `u-width-${width}`,
    { 'MemoryDisplay--3x3': size === SIZE.threeByThree },
    { 'MemoryDisplay--4x4': size === SIZE.fourByFour }
  );

  const handleTileClick = tile => {
    let hasJustMatched;
    if (currentlyFlippedTiles.length === 1) {
      setCurrentlyFlippedTiles([currentlyFlippedTiles[0], tile]);
      hasJustMatched = currentlyFlippedTiles[0].pairKey === tile.pairKey;
    } else {
      setCurrentlyFlippedTiles([tile]);
      hasJustMatched = false;
    }

    if (hasJustMatched) {
      setTimeout(() => {
        setMatchedTilePairKeys(prevState => [...prevState, tile.pairKey]);
      }, 500);
    }
  };

  const renderTile = (tile, index) => {
    const elementsToRender = [];
    const isFlipped = currentlyFlippedTiles.includes(tile);
    const wasMatched = matchedTilePairKeys.includes(tile.pairKey);
    const reserveCentralSpace = size === SIZE.threeByThree && index === 4;

    if (reserveCentralSpace) {
      elementsToRender.push(<div key="emptyTile" />);
    }

    elementsToRender.push((
      <FlipCard
        key={tile.key}
        flipped={isFlipped || wasMatched}
        locked={isFlipped}
        disabled={wasMatched}
        frontContent={(
          <MemoryTile
            text={tile.text}
            sourceUrl={tile.sourceUrl}
            playMedia={isFlipped}
            showMatched={wasMatched}
            />
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
