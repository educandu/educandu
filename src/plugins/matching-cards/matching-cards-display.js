import classNames from 'classnames';
import { SIZE } from './constants.js';
import FlipCard from '../../components/flip-card.js';
import MatchingCardsTile from './matching-cards-tile.js';
import React, { useEffect, useRef, useState } from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { getRandomizedTilesFromPairs } from './matching-cards-utils.js';

function MatchingCardsDisplay({ content }) {
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
    'MatchingCardsDisplay',
    `u-width-${width}`,
    { 'MatchingCardsDisplay--3x3': size === SIZE.threeByThree },
    { 'MatchingCardsDisplay--4x4': size === SIZE.fourByFour }
  );

  const handleTileClick = tile => {
    let hasJustMatched = false;

    switch (currentlyFlippedTiles.length) {
      case 0:
        setCurrentlyFlippedTiles([tile]);
        break;
      case 1:
        setCurrentlyFlippedTiles([currentlyFlippedTiles[0], tile]);
        hasJustMatched = currentlyFlippedTiles[0].pairKey === tile.pairKey;
        break;
      case 2:
        if (tile.key === currentlyFlippedTiles[0].key || tile.key === currentlyFlippedTiles[1].key) {
          setCurrentlyFlippedTiles([]);
        } else {
          setCurrentlyFlippedTiles([tile]);
        }
        break;
      default:
        break;
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
    const isSingleFlipped = isFlipped && currentlyFlippedTiles.length === 1;
    const wasMatched = matchedTilePairKeys.includes(tile.pairKey);
    const reserveCentralSpace = size === SIZE.threeByThree && index === 4;

    if (reserveCentralSpace) {
      elementsToRender.push(<div key="emptyTile" />);
    }

    elementsToRender.push((
      <FlipCard
        key={tile.key}
        flipped={isFlipped || wasMatched}
        locked={isSingleFlipped}
        disabled={wasMatched}
        frontContent={(
          <MatchingCardsTile
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

MatchingCardsDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MatchingCardsDisplay;
