import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function CardSelector({ cards, selectedCardIndex, visitedCardIndices, treatSelectedCardAsVisited, disabled, onCardSelected }) {
  const renderCard = (card, index) => {
    const isSelected = selectedCardIndex === index;
    const isVisited = visitedCardIndices.includes(index);
    const classes = classNames({
      'CardSelector-card': true,
      'is-disabled': disabled,
      'is-selected': !disabled && isSelected,
      'is-visited': !disabled && (isVisited || (treatSelectedCardAsVisited && isSelected))
    });

    return (
      <Tooltip title={card.tooltip} key={index} disabled={disabled}>
        <div className={classes} onClick={() => onCardSelected(index)}>
          {card.label}
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="CardSelector">{cards.map(renderCard)}</div>
  );
}

CardSelector.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    tooltip: PropTypes.string
  })).isRequired,
  disabled: PropTypes.bool,
  onCardSelected: PropTypes.func.isRequired,
  selectedCardIndex: PropTypes.number.isRequired,
  treatSelectedCardAsVisited: PropTypes.bool,
  visitedCardIndices: PropTypes.arrayOf(PropTypes.number)
};

CardSelector.defaultProps = {
  disabled: false,
  treatSelectedCardAsVisited: false,
  visitedCardIndices: []
};

export default CardSelector;
