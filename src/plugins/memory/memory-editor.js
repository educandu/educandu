import { SIZE } from './constants.js';
import React, { useState } from 'react';
import { Button, Form, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import { resizeTilePairs } from './memory-utils.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function MemoryEditor({ content, onContentChanged }) {
  const { t } = useTranslation('memory');

  const { title, size, tilePairs } = content;
  const [selectedTilesPairIndex, setSelectedTilesPairIndex] = useState(0);

  const renderTileButton = index => {
    const isTileDataMissing = tilePairs[index].some(tile => !tile.text);
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

  const handleTitleValueChanged = event => {
    const { value } = event.target;
    changeContent({ title: value });
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

  return (
    <div className="MemoryEditor">
      <Form>
        <FormItem label={`${t('common:title')}:`} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={title} onChange={handleTitleValueChanged} />
        </FormItem>
        <FormItem label={t('common:size')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={size} onChange={handleSizeChange}>
            <RadioButton value={SIZE.threeByThree}>3 x 3</RadioButton>
            <RadioButton value={SIZE.fourByFour}>4 x 4</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label={t('tilePairs')} {...FORM_ITEM_LAYOUT}>
          <div className="MemoryEditor-tileButtonGroup">
            {tilePairs.map((pair, index) => renderTileButton(index))}
          </div>
        </FormItem>
        <Form.Item label={t('tileA')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput
            preview
            value={tilePairs[selectedTilesPairIndex][0].text}
            onChange={event => handleTileTextChange(event, 0)}
            />
        </Form.Item>
        <Form.Item label={t('tileB')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput
            preview
            value={tilePairs[selectedTilesPairIndex][1].text}
            onChange={event => handleTileTextChange(event, 1)}
            />
        </Form.Item>
      </Form>
    </div>
  );
}

MemoryEditor.propTypes = {
  ...sectionEditorProps
};

export default MemoryEditor;

