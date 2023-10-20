import PropTypes from 'prop-types';
import LineIcon from './icons/line-icon.js';
import DrawIcon from './icons/draw-icon.js';
import TextIcon from './icons/text-icon.js';
import ShapeIcon from './icons/shape-icon.js';
import ArrowIcon from './icons/arrow-icon.js';
import ClearIcon from './icons/clear-icon.js';
import { useTranslation } from 'react-i18next';
import CircleIcon from './icons/circle-icon.js';
import SelectIcon from './icons/select-icon.js';
import EraserIcon from './icons/eraser-icon.js';
import React, { useMemo, useState } from 'react';
import TriangleIcon from './icons/triangle-icon.js';
import FontSizeIcon from './icons/font-size-icon.js';
import RectangleIcon from './icons/rectangle-icon.js';
import { Button, Dropdown, Radio, Tooltip } from 'antd';
import ColorPicker from '../../components/color-picker.js';
import StrokeWidthIcon from './icons/stroke-width-icon.js';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export const MODES = {
  select: 'select',
  freeDraw: 'freeDraw'
};

export const FONT_SIZES = {
  small: 16,
  medium: 20,
  large: 24
};

export const STROKE_WIDTHS = {
  small: 1,
  medium: 3,
  large: 5
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
  onClearClick
}) {
  const { t } = useTranslation('whiteboard');

  const [openMenu, setOpenMenu] = useState(null);

  const shapeMenuItems = useMemo(() => [
    {
      key: SHAPE_TYPES.line,
      label: <LineIcon />,
      onClick: onLineClick
    },
    {
      key: SHAPE_TYPES.arrow,
      label: <ArrowIcon />,
      onClick: onArrowClick
    },
    {
      key: SHAPE_TYPES.circle,
      label: <CircleIcon />,
      onClick: onCircleClick
    },
    {
      key: SHAPE_TYPES.triangle,
      label: <TriangleIcon />,
      onClick: onTriangleClick
    },
    {
      key: SHAPE_TYPES.rectangle,
      label: <RectangleIcon />,
      onClick: onRectangleClick
    }
  ], [onLineClick, onArrowClick, onCircleClick, onTriangleClick, onRectangleClick]);

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

  const handleModeChange = event => {
    onModeChange(event.target.value);
  };

  const handleMenuOpenChange = menu => {
    setOpenMenu(openMenu ? null : menu);
  };

  const handleShapeMenuClick = ({ key }) => {
    const menuItem = shapeMenuItems.find(item => item.key === key);
    menuItem.onClick();
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
      <RadioGroup value={mode} onChange={handleModeChange}>
        <Tooltip title={t('selectTooltip')}>
          <RadioButton value={MODES.select}><SelectIcon /></RadioButton>
        </Tooltip>
        <Tooltip title={t('freeDrawTooltip')}>
          <RadioButton value={MODES.freeDraw}><DrawIcon /></RadioButton>
        </Tooltip>
      </RadioGroup>
      <Tooltip title={t('textTooltip')}>
        <Button onClick={onTextClick} icon={<TextIcon />} />
      </Tooltip>
      <Tooltip title={t('shapeTooltip')}>
        <Dropdown
          trigger={['click']}
          placement="bottom"
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

      <Tooltip title={t('fontSizeTooltip')}>
        <Dropdown
          trigger={['click']}
          placement="bottom"
          open={openMenu === MENUS.fontSize}
          onOpenChange={() => handleMenuOpenChange(MENUS.fontSize)}
          menu={{ items: fontSizeMenuItems, onClick: handleFontSizeMenuClick }}
          >
          <Button icon={<FontSizeIcon />} className="WhiteboardToolbar-sizeButton">
            <span className="WhiteboardToolbar-sizeButtonText">
              {selectedFontSizeItem.label}
            </span>
          </Button>
        </Dropdown>
      </Tooltip>

      <Tooltip title={t('strokeWidthTooltip')}>
        <Dropdown
          trigger={['click']}
          placement="bottom"
          open={openMenu === MENUS.strokeWidth}
          onOpenChange={() => handleMenuOpenChange(MENUS.strokeWidth)}
          menu={{ items: strokeWidthMenuItems, onClick: handleStrokeWidthMenuClick }}
          >
          <Button icon={<StrokeWidthIcon />} className="WhiteboardToolbar-sizeButton">
            <span className="WhiteboardToolbar-sizeButtonText">
              {selectedStrokeWidthItem.label}
            </span>
          </Button>
        </Dropdown>
      </Tooltip>

      <Tooltip title={t('strokeColorTooltip')}>
        <ColorPicker color={strokeColor} onChange={onStrokeColorChange} />
      </Tooltip>

      <Tooltip title={t('fillColorTooltip')}>
        <ColorPicker color={fillColor} onChange={onFillColorChange} />
      </Tooltip>

      <Tooltip title={t('clearTooltip')}>
        <Button onClick={onClearClick} icon={<ClearIcon />} />
      </Tooltip>
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
  onClearClick: PropTypes.func.isRequired
};
