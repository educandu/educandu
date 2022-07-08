import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function CardSelector({ cards, selectedCardIndex, previouslySelectedCardIndices, onCardSelected }) {
  const renderCard = (card, index) => {
    const classes = classNames({
      'CardSelector-card': true,
      'is-selected': selectedCardIndex === index,
      'was-selected': previouslySelectedCardIndices.includes(index)
    });

    return (
      <Tooltip title={card.tooltip} key={index}>
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
  onCardSelected: PropTypes.func.isRequired,
  previouslySelectedCardIndices: PropTypes.arrayOf(PropTypes.number),
  selectedCardIndex: PropTypes.number.isRequired
};

CardSelector.defaultProps = {
  previouslySelectedCardIndices: []
};

export default CardSelector;
