import PropTypes from 'prop-types';
import LineIcon from './icons/line-icon.js';
import TextIcon from './icons/text-icon.js';
import ShapeIcon from './icons/shape-icon.js';
import ArrowIcon from './icons/arrow-icon.js';
import ResetIcon from './icons/reset-icon.js';
import { useTranslation } from 'react-i18next';
import CircleIcon from './icons/circle-icon.js';
import SelectIcon from './icons/select-icon.js';
import EraserIcon from './icons/eraser-icon.js';
import React, { Fragment, useState } from 'react';
import TriangleIcon from './icons/triangle-icon.js';
import FontSizeIcon from './icons/font-size-icon.js';
import FreeDrawIcon from './icons/free-draw-icon.js';
import RectangleIcon from './icons/rectangle-icon.js';
import FillColorIcon from './icons/fill-color-icon.js';
import StrokeWidthIcon from './icons/stroke-width-icon.js';
import StrokeColorIcon from './icons/stroke-color-icon.js';
import SwatchesPickerNs from 'react-color/lib/Swatches.js';
import { Button, Dropdown, Popover, Radio, Tooltip } from 'antd';
import { DEFAULT_COLOR_SWATCHES, DEFAULT_COLOR_PICKER_WIDTH } from '../../domain/constants.js';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const SwatchesPicker = SwatchesPickerNs.default || SwatchesPickerNs;

export const MODES = {
  select: 'select',
  freeDraw: 'freeDraw'
};

export const FONT_SIZES = {
  small: 16,
  medium: 22,
  large: 26
};

export const STROKE_WIDTHS = {
  small: 2,
  medium: 3,
  large: 6
};

const SHAPE_TYPES = {
  line: 'line',
  arrow: 'arrow',
  circle: 'circle',
  triangle: 'triangle',
  rectangle: 'rectangle'
};

const MENUS = {
  shape: 'shape',
  fontSize: 'fontSize',
  strokeWidth: 'strokeWidth'
};

const shapeMenuItems = [
  {
    key: SHAPE_TYPES.line,
    label: <LineIcon />
  },
  {
    key: SHAPE_TYPES.arrow,
    label: <ArrowIcon />
  },
  {
    key: SHAPE_TYPES.circle,
    label: <CircleIcon />
  },
  {
    key: SHAPE_TYPES.triangle,
    label: <TriangleIcon />
  },
  {
    key: SHAPE_TYPES.rectangle,
    label: <RectangleIcon />
  }
];

const fontSizeMenuItems = [
  {
    key: FONT_SIZES.small,
    label: 'S'
  },
  {
    key: FONT_SIZES.medium,
    label: 'M'
  },
  {
    key: FONT_SIZES.large,
    label: 'L'
  }
];

const strokeWidthMenuItems = [
  {
    key: STROKE_WIDTHS.small,
    label: 'S'
  },
  {
    key: STROKE_WIDTHS.medium,
    label: 'M'
  },
  {
    key: STROKE_WIDTHS.large,
    label: 'L'
  }
];

export function WhiteboardToolbar({
  mode,
  fontSize,
  strokeWidth,
  strokeColor,
  fillColor,
  onModeChange,
  onTextClick,
  onLineClick,
  onArrowClick,
  onRectangleClick,
  onTriangleClick,
  onCircleClick,
  onEraseClick,
  onFontSizeChange,
  onStrokeWidthChange,
  onStrokeColorChange,
  onFillColorChange,
  onFillColorRemove,
  onResetClick
}) {
  const { t } = useTranslation('whiteboard');

  const [openMenu, setOpenMenu] = useState(null);

  const handleModeChange = event => {
    onModeChange(event.target.value);
  };

  const handleMenuOpenChange = menu => {
    setOpenMenu(openMenu ? null : menu);
  };

  const handleShapeMenuClick = ({ key }) => {
    switch (key) {
      case SHAPE_TYPES.line:
        onLineClick();
        break;
      case SHAPE_TYPES.arrow:
        onArrowClick();
        break;
      case SHAPE_TYPES.circle:
        onCircleClick();
        break;
      case SHAPE_TYPES.triangle:
        onTriangleClick();
        break;
      case SHAPE_TYPES.rectangle:
        onRectangleClick();
        break;
      default:
        break;
    }
    setOpenMenu(null);
  };

  const handleFontSizeMenuClick = ({ key }) => {
    onFontSizeChange(Number(key));
    setOpenMenu(null);
  };

  const handleStrokeWidthMenuClick = ({ key }) => {
    onStrokeWidthChange(Number(key));
    setOpenMenu(null);
  };

  const selectedFontSizeItem = fontSizeMenuItems.find(item => item.key === fontSize);
  const selectedStrokeWidthItem = strokeWidthMenuItems.find(item => item.key === strokeWidth);

  return (
    <div className="WhiteboardToolbar">
      <div className="WhiteboardToolbar-group">
        <RadioGroup value={mode} onChange={handleModeChange}>
          <Tooltip title={t('selectTooltip')}>
            <RadioButton value={MODES.select}><SelectIcon /></RadioButton>
          </Tooltip>
          <Tooltip title={t('freeDrawTooltip')}>
            <RadioButton value={MODES.freeDraw}><FreeDrawIcon /></RadioButton>
          </Tooltip>
        </RadioGroup>
        <Tooltip title={t('textTooltip')}>
          <Button onClick={onTextClick} icon={<TextIcon />} />
        </Tooltip>
        <Tooltip title={t('shapeTooltip')}>
          <Dropdown
            trigger={['click']}
            placement="top"
            open={openMenu === MENUS.shape}
            onOpenChange={() => handleMenuOpenChange(MENUS.shape)}
            menu={{ items: shapeMenuItems, onClick: handleShapeMenuClick }}
            >
            <Button icon={<ShapeIcon />} />
          </Dropdown>
        </Tooltip>
        <Tooltip title={t('eraseTooltip')}>
          <Button onClick={onEraseClick} icon={<EraserIcon />} disabled={mode === MODES.freeDraw} />
        </Tooltip>

        <Tooltip title={t('resetTooltip')}>
          <Button onClick={onResetClick} icon={<ResetIcon />} />
        </Tooltip>
      </div>

      <div className="WhiteboardToolbar-group">
        <Tooltip title={t('fontSizeTooltip')}>
          <Dropdown
            trigger={['click']}
            placement="top"
            open={openMenu === MENUS.fontSize}
            onOpenChange={() => handleMenuOpenChange(MENUS.fontSize)}
            menu={{ items: fontSizeMenuItems, onClick: handleFontSizeMenuClick }}
            >
            <Button icon={<FontSizeIcon />} className="WhiteboardToolbar-buttonWithSelection">
              <span className="WhiteboardToolbar-buttonWithSelectionText">
                {selectedFontSizeItem.label}
              </span>
            </Button>
          </Dropdown>
        </Tooltip>

        <Tooltip title={t('strokeWidthTooltip')}>
          <Dropdown
            trigger={['click']}
            placement="top"
            open={openMenu === MENUS.strokeWidth}
            onOpenChange={() => handleMenuOpenChange(MENUS.strokeWidth)}
            menu={{ items: strokeWidthMenuItems, onClick: handleStrokeWidthMenuClick }}
            >
            <Button icon={<StrokeWidthIcon />} className="WhiteboardToolbar-buttonWithSelection">
              <span className="WhiteboardToolbar-buttonWithSelectionText">
                {selectedStrokeWidthItem.label}
              </span>
            </Button>
          </Dropdown>
        </Tooltip>

        <Popover
          trigger="click"
          content={
            <SwatchesPicker
              color={strokeColor}
              colors={DEFAULT_COLOR_SWATCHES}
              width={DEFAULT_COLOR_PICKER_WIDTH}
              onChange={({ hex }) => onStrokeColorChange(hex)}
              />
          }
          >
          <Tooltip title={t('strokeColorTooltip')}>
            <Button icon={<StrokeColorIcon />} className="WhiteboardToolbar-buttonWithSelection">
              <div className="WhiteboardToolbar-selectedColor" style={{ backgroundColor: strokeColor }} />
            </Button>
          </Tooltip>
        </Popover>

        <Popover
          trigger="click"
          content={
            <Fragment>
              <SwatchesPicker
                color={fillColor}
                colors={DEFAULT_COLOR_SWATCHES}
                width={DEFAULT_COLOR_PICKER_WIDTH}
                onChange={({ hex }) => onFillColorChange(hex)}
                />
              <Button className="WhiteboardToolbar-removeColor" onClick={onFillColorRemove}>
                {t('removeFillColor')}
              </Button>
            </Fragment>
          }
          >
          <Tooltip title={t('fillColorTooltip')}>
            <Button icon={<FillColorIcon />} className="WhiteboardToolbar-buttonWithSelection">
              <div className="WhiteboardToolbar-selectedColor" style={{ backgroundColor: fillColor }} />
            </Button>
          </Tooltip>
        </Popover>
      </div>
    </div>
  );
}

WhiteboardToolbar.propTypes = {
  mode: PropTypes.oneOf(Object.values(MODES)).isRequired,
  fontSize: PropTypes.oneOf(Object.values(FONT_SIZES)).isRequired,
  strokeWidth: PropTypes.oneOf(Object.values(STROKE_WIDTHS)).isRequired,
  strokeColor: PropTypes.string.isRequired,
  fillColor: PropTypes.string.isRequired,
  onModeChange: PropTypes.func.isRequired,
  onTextClick: PropTypes.func.isRequired,
  onLineClick: PropTypes.func.isRequired,
  onArrowClick: PropTypes.func.isRequired,
  onRectangleClick: PropTypes.func.isRequired,
  onTriangleClick: PropTypes.func.isRequired,
  onCircleClick: PropTypes.func.isRequired,
  onEraseClick: PropTypes.func.isRequired,
  onFontSizeChange: PropTypes.func.isRequired,
  onStrokeWidthChange: PropTypes.func.isRequired,
  onStrokeColorChange: PropTypes.func.isRequired,
  onFillColorChange: PropTypes.func.isRequired,
  onFillColorRemove: PropTypes.func.isRequired,
  onResetClick: PropTypes.func.isRequired
};
