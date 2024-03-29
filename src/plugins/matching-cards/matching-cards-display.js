import classNames from 'classnames';
import { SIZE } from './constants.js';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useIsMounted } from '../../ui/hooks.js';
import { UndoOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import FlipCard from '../../components/flip-card.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { getRandomizedTilesFromPairs } from './matching-cards-utils.js';
import MatchingCardsTileDisplay from './matching-cards-tile-display.js';

function MatchingCardsDisplay({ content }) {
  const { size, tilePairs, width } = content;
  const { t } = useTranslation('matchingCards');

  const isMounted = useIsMounted();
  const [tiles, setTiles] = useState([]);
  const [playingTileKey, setPlayingTileKey] = useState(null);
  const [matchedTilePairKeys, setMatchedTilePairKeys] = useState([]);
  const [currentlyFlippedTiles, setCurrentlyFlippedTiles] = useState([]);

  useEffect(() => {
    setMatchedTilePairKeys([]);
    setCurrentlyFlippedTiles([]);
    setTiles(getRandomizedTilesFromPairs(tilePairs));
  }, [tilePairs]);

  const gridClasses = classNames(
    'MatchingCardsDisplay-grid',
    `u-width-${width}`,
    { 'MatchingCardsDisplay-grid--3x3': size === SIZE.threeByThree },
    { 'MatchingCardsDisplay-grid--4x4': size === SIZE.fourByFour }
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
        if (isMounted.current) {
          setMatchedTilePairKeys(prevState => [...prevState, tile.pairKey]);
        }
      }, 500);
    }
  };

  const handleResetClick = () => {
    setMatchedTilePairKeys([]);
    setCurrentlyFlippedTiles([]);
    setTimeout(() => {
      if (isMounted.current) {
        setTiles(getRandomizedTilesFromPairs(tilePairs));
      }
    }, 500);
  };

  const handleTogglePlayMediaInTile = (event, tileKey) => {
    event.stopPropagation();
    setPlayingTileKey(playingTileKey === tileKey ? null : tileKey);
  };

  useEffect(() => {
    const lastFlippedTile = currentlyFlippedTiles[currentlyFlippedTiles.length - 1];
    const wasMatched = lastFlippedTile && matchedTilePairKeys.includes(lastFlippedTile.pairKey);

    setPlayingTileKey(lastFlippedTile && !wasMatched ? lastFlippedTile.key : null);
  }, [currentlyFlippedTiles, matchedTilePairKeys]);

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
        highlighted={wasMatched}
        frontContent={
          <MatchingCardsTileDisplay
            text={tile.text}
            sourceUrl={tile.sourceUrl}
            playbackRange={tile.playbackRange}
            playMedia={playingTileKey === tile.key}
            canTogglePlayMedia
            onTogglePlayMedia={event => handleTogglePlayMediaInTile(event, tile.key)}
            />
        }
        onClick={() => handleTileClick(tile)}
        />
    ));

    return elementsToRender;
  };

  return (
    <div className="MatchingCardsDisplay">
      <div className={gridClasses}>
        {tiles.map(renderTile)}
      </div>
      <Tooltip title={t('common:reset')}>
        <Button
          shape="circle"
          icon={<UndoOutlined />}
          onClick={handleResetClick}
          className="MatchingCardsDisplay-resetButton"
          />
      </Tooltip>
    </div>
  );
}

MatchingCardsDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MatchingCardsDisplay;
