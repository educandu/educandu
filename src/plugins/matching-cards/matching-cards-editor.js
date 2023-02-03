import classNames from 'classnames';
import { SIZE } from './constants.js';
import React, { useState } from 'react';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import { Button, Divider, Form, Radio } from 'antd';
import { resizeTilePairs } from './matching-cards-utils.js';
import { FlipCardFace } from '../../components/flip-card.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import MatchingCardsTileEditor from './matching-cards-tile-editor.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import MatchingCardsTileDisplay from './matching-cards-tile-display.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function MatchingCardsEditor({ content, onContentChanged }) {
  const { t } = useTranslation('matchingCards');

  const { size, tilePairs, width } = content;
  const [selectedTilesPairIndex, setSelectedTilesPairIndex] = useState(0);

  const renderTileButton = index => {
    const isTileDataMissing = tilePairs[index].some(tile => !tile.text && !tile.sourceUrl);
    return (
      <Button
        key={index}
        danger={isTileDataMissing}
        className="MatchingCardsEditor-tileButton"
        type={selectedTilesPairIndex === index ? 'primary' : 'default'}
        onClick={() => setSelectedTilesPairIndex(index)}
        >
        {index + 1}
      </Button>
    );
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleWidthChange = value => {
    changeContent({ width: value });
  };

  const handleSizeChange = event => {
    const { value } = event.target;
    const newTilePairs = resizeTilePairs(tilePairs, value);
    if (selectedTilesPairIndex >= newTilePairs.length) {
      setSelectedTilesPairIndex(0);
    }
    changeContent({ size: value, tilePairs: newTilePairs });
  };

  const handleTileTextChange = (event, tileIndex) => {
    const { value } = event.target;
    const newTilePairs = cloneDeep(tilePairs);
    newTilePairs[selectedTilesPairIndex][tileIndex].text = value;
    changeContent({ tilePairs: newTilePairs });
  };

  const handleTileSourceUrlChange = (value, tileIndex) => {
    const newTilePairs = cloneDeep(tilePairs);
    newTilePairs[selectedTilesPairIndex][tileIndex].sourceUrl = value;
    newTilePairs[selectedTilesPairIndex][tileIndex].playbackRange = [0, 1];
    changeContent({ tilePairs: newTilePairs });
  };

  const handleTilePlaybackRangeChange = (value, tileIndex) => {
    const newTilePairs = cloneDeep(tilePairs);
    newTilePairs[selectedTilesPairIndex][tileIndex].playbackRange = value;
    changeContent({ tilePairs: newTilePairs });
  };

  const renderTileEditor = tileIndex => {
    const tile = tilePairs[selectedTilesPairIndex][tileIndex];

    return (
      <MatchingCardsTileEditor
        text={tile.text}
        sourceUrl={tile.sourceUrl}
        playbackRange={tile.playbackRange}
        onTextChange={event => handleTileTextChange(event, tileIndex)}
        onSourceUrlChange={event => handleTileSourceUrlChange(event, tileIndex)}
        onPlaybackRangeChange={event => handleTilePlaybackRangeChange(event, tileIndex)}
        />
    );
  };

  const previewClasses = classNames(
    'MatchingCardsEditor-preview',
    `u-width-${width}`,
    { 'MatchingCardsEditor-preview--3x3': size === SIZE.threeByThree },
    { 'MatchingCardsEditor-preview--4x4': size === SIZE.fourByFour }
  );

  return (
    <div className="MatchingCardsEditor">
      <Form labelAlign="left">
        <FormItem label={t('common:size')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={size} onChange={handleSizeChange}>
            <RadioButton value={SIZE.threeByThree}>3 x 3</RadioButton>
            <RadioButton value={SIZE.fourByFour}>4 x 4</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem
          className="ImageEditor-widthInput"
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
        <FormItem label={t('tilePairs')} {...FORM_ITEM_LAYOUT}>
          <div className="MatchingCardsEditor-tileButtonGroup">
            {tilePairs.map((pair, index) => renderTileButton(index))}
          </div>
        </FormItem>

        <Divider plain>{t('tileA')}</Divider>
        {renderTileEditor(0)}

        <Divider plain>{t('tileB')}</Divider>
        {renderTileEditor(1)}
      </Form>

      <Divider plain>{t('preview')}</Divider>
      <div className={previewClasses}>
        <div className="MatchingCardsEditor-previewTile MatchingCardsEditor-previewTile--empty" />
        <div className="MatchingCardsEditor-previewTile">
          <div className="MatchingCardsEditor-previewTileFace">
            <FlipCardFace
              content={(
                <MatchingCardsTileDisplay
                  text={tilePairs[selectedTilesPairIndex][0].text}
                  sourceUrl={tilePairs[selectedTilesPairIndex][0].sourceUrl}
                  playbackRange={tilePairs[selectedTilesPairIndex][0].playbackRange}
                  />
              )}
              />
          </div>
        </div>
        <div className="MatchingCardsEditor-previewTile">
          <div className="MatchingCardsEditor-previewTileFace">
            <FlipCardFace
              content={(
                <MatchingCardsTileDisplay
                  text={tilePairs[selectedTilesPairIndex][1].text}
                  sourceUrl={tilePairs[selectedTilesPairIndex][1].sourceUrl}
                  playbackRange={tilePairs[selectedTilesPairIndex][1].playbackRange}
                  />
              )}
              />
          </div>
        </div>
        <div className="MatchingCardsEditor-previewTile MatchingCardsEditor-previewTile--empty" />
      </div>
    </div>
  );
}

MatchingCardsEditor.propTypes = {
  ...sectionEditorProps
};

export default MatchingCardsEditor;

