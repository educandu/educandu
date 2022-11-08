import classNames from 'classnames';
import { SIZE } from './constants.js';
import MemoryTile from './memory-tile.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import React, { Fragment, useState } from 'react';
import { resizeTilePairs } from './memory-utils.js';
import UrlInput from '../../components/url-input.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import { FlipCardFace } from '../../components/flip-card.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { Button, Divider, Form, Radio, Tooltip } from 'antd';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function MemoryEditor({ content, onContentChanged }) {
  const { t } = useTranslation('memory');

  const { size, tilePairs, width } = content;
  const [selectedTilesPairIndex, setSelectedTilesPairIndex] = useState(0);

  const renderTileButton = index => {
    const isTileDataMissing = tilePairs[index].some(tile => !tile.text && !tile.sourceUrl);
    return (
      <Button
        size="small"
        key={index}
        danger={isTileDataMissing}
        className="MemoryEditor-tileButton"
        type={selectedTilesPairIndex === index ? 'primary' : 'default'}
        onClick={() => setSelectedTilesPairIndex(index)}
        >
        {index + 1}
      </Button>
    );
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent, false);
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
    changeContent({ tilePairs: newTilePairs });
  };

  const previewClasses = classNames(
    'MemoryEditor-preview',
    `u-width-${width}`,
    { 'MemoryEditor-preview--3x3': size === SIZE.threeByThree },
    { 'MemoryEditor-preview--4x4': size === SIZE.fourByFour }
  );

  return (
    <div className="MemoryEditor">
      <Form>
        <FormItem label={t('common:size')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={size} onChange={handleSizeChange}>
            <RadioButton value={SIZE.threeByThree}>3 x 3</RadioButton>
            <RadioButton value={SIZE.fourByFour}>4 x 4</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem
          className="ImageEditor-widthInput"
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
        <FormItem label={t('tilePairs')} {...FORM_ITEM_LAYOUT}>
          <div className="MemoryEditor-tileButtonGroup">
            {tilePairs.map((pair, index) => renderTileButton(index))}
          </div>
        </FormItem>

        <Divider plain>{t('tileA')}</Divider>
        <FormItem label={t('text')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput
            value={tilePairs[selectedTilesPairIndex][0].text}
            onChange={event => handleTileTextChange(event, 0)}
            />
        </FormItem>
        <FormItem label={t('url')} {...FORM_ITEM_LAYOUT}>
          <UrlInput
            value={tilePairs[selectedTilesPairIndex][0].sourceUrl}
            onChange={event => handleTileSourceUrlChange(event, 0)}
            />
        </FormItem>

        <Divider plain>{t('tileB')}</Divider>
        <FormItem label={t('text')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput
            value={tilePairs[selectedTilesPairIndex][1].text}
            onChange={event => handleTileTextChange(event, 1)}
            />
        </FormItem>
        <FormItem label={t('url')} {...FORM_ITEM_LAYOUT}>
          <UrlInput
            value={tilePairs[selectedTilesPairIndex][1].sourceUrl}
            onChange={event => handleTileSourceUrlChange(event, 1)}
            />
        </FormItem>
      </Form>

      <Divider plain>{t('preview')}</Divider>
      <div className={previewClasses}>
        <div className="MemoryEditor-previewTile MemoryEditor-previewTile--empty" />
        <div className="MemoryEditor-previewTile">
          <div className="MemoryEditor-previewTileFace">
            <FlipCardFace
              content={(
                <MemoryTile
                  text={tilePairs[selectedTilesPairIndex][0].text}
                  sourceUrl={tilePairs[selectedTilesPairIndex][0].sourceUrl}
                  />
              )}
              />
          </div>
        </div>
        <div className="MemoryEditor-previewTile">
          <div className="MemoryEditor-previewTileFace">
            <FlipCardFace
              content={(
                <MemoryTile
                  text={tilePairs[selectedTilesPairIndex][1].text}
                  sourceUrl={tilePairs[selectedTilesPairIndex][1].sourceUrl}
                  />
              )}
              />
          </div>
        </div>
        <div className="MemoryEditor-previewTile MemoryEditor-previewTile--empty" />
      </div>
    </div>
  );
}

MemoryEditor.propTypes = {
  ...sectionEditorProps
};

export default MemoryEditor;

