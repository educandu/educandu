import React from 'react';
import { Form, Radio } from 'antd';
import classNames from 'classnames';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { BEHAVIOR, TYPE, COLOR_SCHEME } from './constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import MusicAccentuationIconRenderer from './music-accentuation-icon-renderer.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function MusicAccentuationEditor({ content, onContentChanged }) {
  const { t } = useTranslation('musicAccentuation');
  const { text, behavior, type, colorScheme, width } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleTypeChange = event => {
    updateContent({ type: event.target.value });
  };

  const handleColorSchemeChange = event => {
    updateContent({ colorScheme: event.target.value });
  };

  const handleBehaviorChange = event => {
    updateContent({ behavior: event.target.value });
  };

  const handleTextChange = event => {
    updateContent({ text: event.target.value });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  const renderTypeRadio = typeValue => {
    return (
      <Radio key={typeValue} className="MusicAccentuationEditor-typeRadio" value={typeValue}>
        <div className="MusicAccentuationEditor-typeRadioLabel">
          <MusicAccentuationIconRenderer className="MusicAccentuationEditor-typeRadioIcon" type={typeValue} />
          {t(`type_${typeValue}`)}
        </div>
      </Radio>
    );
  };

  const renderColorSchemeRadio = colorSchemeValue => {
    const colorBlockClassName = classNames(
      'MusicAccentuation-colorScheme',
      'MusicAccentuation-colorScheme--editor',
      `MusicAccentuation-colorScheme--${colorSchemeValue}`
    );

    return (
      <Radio key={colorSchemeValue} className="MusicAccentuationEditor-colorSchemeRadio" value={colorSchemeValue}>
        <div className={colorBlockClassName} />
      </Radio>
    );
  };

  const sortedTypes = [
    TYPE.assignment,
    TYPE.harmony,
    TYPE.hint,
    TYPE.melody,
    TYPE.movement,
    TYPE.playing,
    TYPE.reading,
    TYPE.research,
    TYPE.rhythm,
    TYPE.standardSolution
  ];

  const sortedColorSchemes = [
    COLOR_SCHEME.red,
    COLOR_SCHEME.orange,
    COLOR_SCHEME.pink,
    COLOR_SCHEME.lila,
    COLOR_SCHEME.yellow,
    COLOR_SCHEME.green,
    COLOR_SCHEME.khaki,
    COLOR_SCHEME.blue
  ];

  return (
    <div className="MusicAccentuationEditor">
      <Form labelAlign="left">
        <FormItem label={t('common:type')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup className="MusicAccentuationEditor-radioGroup" value={type} onChange={handleTypeChange}>
            {sortedTypes.map(renderTypeRadio)}
          </RadioGroup>
        </FormItem>
        <FormItem label={t('colorScheme')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup className="MusicAccentuationEditor-radioGroup" value={colorScheme} onChange={handleColorSchemeChange}>
            {sortedColorSchemes.map(renderColorSchemeRadio)}
          </RadioGroup>
        </FormItem>
        <FormItem label={t('behavior')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={behavior} onChange={handleBehaviorChange}>
            <RadioButton value={BEHAVIOR.expandable}>{t('behavior_expandable')}</RadioButton>
            <RadioButton value={BEHAVIOR.collapsible}>{t('behavior_collapsible')}</RadioButton>
            <RadioButton value={BEHAVIOR.static}>{t('behavior_static')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label={t('common:text')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={text} onChange={handleTextChange} />
        </FormItem>
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
      </Form>
    </div>
  );
}

MusicAccentuationEditor.propTypes = {
  ...sectionEditorProps
};
