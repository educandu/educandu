import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useState } from 'react';
import SwatchesPickerNs from 'react-color/lib/Swatches.js';
import { Button, Dropdown, Popover, Radio, Tooltip } from 'antd';
import { DEFAULT_COLOR_SWATCHES, DEFAULT_COLOR_PICKER_WIDTH } from '../../domain/constants.js';
import {
  ArrowIcon,
  CircleIcon,
  DownloadIcon,
  EraserIcon,
  FillColorIcon,
  FontSizeIcon,
  FreeDrawIcon,
  LineIcon,
  RectangleIcon,
  ResetIcon,
  SelectIcon,
  ShapeIcon,
  StrokeColorIcon,
  StrokeWidthIcon,
  TextIcon,
  TriangleIcon
} from '../../components/icons/icons.js';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const SwatchesPicker = SwatchesPickerNs.default || SwatchesPickerNs;

export const DEFAULT_STROKE_COLOR = '#000000';

export const TRANSPARENT_FILL_COLOR = 'rgba(255, 255, 255, 0.0)';

export const MODE = {
  select: 'select',
  freeDraw: 'freeDraw'
};

export const FONT_SIZE = {
  small: 16,
  medium: 22,
  large: 26
};

export const STROKE_WIDTH = {
  small: 2,
  medium: 3,
  large: 6
};

const SHAPE_TYPE = {
  line: 'line',
  arrow: 'arrow',
  circle: 'circle',
  triangle: 'triangle',
  rectangle: 'rectangle'
};

const MENU = {
  shape: 'shape',
  fontSize: 'fontSize',
  strokeWidth: 'strokeWidth',
  strokeColor: 'strokeColor',
  fillColor: 'fillColor'
};

const shapeMenuItems = [
  {
    key: SHAPE_TYPE.line,
    label: <LineIcon />
  },
  {
    key: SHAPE_TYPE.arrow,
    label: <ArrowIcon />
  },
  {
    key: SHAPE_TYPE.circle,
    label: <CircleIcon />
  },
  {
    key: SHAPE_TYPE.triangle,
    label: <TriangleIcon />
  },
  {
    key: SHAPE_TYPE.rectangle,
    label: <RectangleIcon />
  }
];

const fontSizeMenuItems = [
  {
    key: FONT_SIZE.small,
    label: 'S'
  },
  {
    key: FONT_SIZE.medium,
    label: 'M'
  },
  {
    key: FONT_SIZE.large,
    label: 'L'
  }
];

const strokeWidthMenuItems = [
  {
    key: STROKE_WIDTH.small,
    label: 'S'
  },
  {
    key: STROKE_WIDTH.medium,
    label: 'M'
  },
  {
    key: STROKE_WIDTH.large,
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
  onResetClick,
  onExportImageClick
}) {
  const { t } = useTranslation('whiteboard');

  const [openMenu, setOpenMenu] = useState(null);

  const handleModeChange = event => {
    onModeChange(event.target.value);
  };

  const handleMenuOpenChange = menu => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleShapeMenuClick = ({ key }) => {
    switch (key) {
      case SHAPE_TYPE.line:
        onLineClick();
        break;
      case SHAPE_TYPE.arrow:
        onArrowClick();
        break;
      case SHAPE_TYPE.circle:
        onCircleClick();
        break;
      case SHAPE_TYPE.triangle:
        onTriangleClick();
        break;
      case SHAPE_TYPE.rectangle:
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

  const handleStrokeColorChange = ({ hex }) => {
    onStrokeColorChange(hex);
    setOpenMenu(null);
  };

  const handleFillColorChange = ({ hex }) => {
    onFillColorChange(hex);
    setOpenMenu(null);
  };

  const handleFillColorRemove = () => {
    onFillColorRemove();
    setOpenMenu(null);
  };

  const selectedFontSizeItem = fontSizeMenuItems.find(item => item.key === fontSize);
  const selectedStrokeWidthItem = strokeWidthMenuItems.find(item => item.key === strokeWidth);

  return (
    <div className="WhiteboardToolbar">
      <div className="WhiteboardToolbar-group">
        <RadioGroup value={mode} onChange={handleModeChange}>
          <Tooltip title={t('selectTooltip')} placement="bottom">
            <RadioButton value={MODE.select}><SelectIcon /></RadioButton>
          </Tooltip>
          <Tooltip title={t('freeDrawTooltip')} placement="bottom">
            <RadioButton value={MODE.freeDraw}><FreeDrawIcon /></RadioButton>
          </Tooltip>
        </RadioGroup>
        <Tooltip title={t('textTooltip')} placement="bottom">
          <Button onClick={onTextClick} icon={<TextIcon />} />
        </Tooltip>
        <Tooltip title={t('shapeTooltip')} placement="bottom">
          <Dropdown
            trigger={['click']}
            placement="top"
            open={openMenu === MENU.shape}
            onOpenChange={() => handleMenuOpenChange(MENU.shape)}
            menu={{ items: shapeMenuItems, onClick: handleShapeMenuClick }}
            >
            <Button icon={<ShapeIcon />} />
          </Dropdown>
        </Tooltip>
        <Tooltip title={t('eraseTooltip')} placement="bottom">
          <Button onClick={onEraseClick} icon={<EraserIcon />} disabled={mode === MODE.freeDraw} />
        </Tooltip>

        <Tooltip title={t('resetTooltip')} placement="bottom">
          <Button onClick={onResetClick} icon={<ResetIcon />} />
        </Tooltip>

        <Tooltip title={t('exportImageTooltip')} placement="bottom">
          <Button onClick={onExportImageClick} icon={<DownloadIcon />} />
        </Tooltip>
      </div>

      <div className="WhiteboardToolbar-group">
        <Tooltip title={t('fontSizeTooltip')} placement="bottom">
          <Dropdown
            trigger={['click']}
            placement="top"
            open={openMenu === MENU.fontSize}
            onOpenChange={() => handleMenuOpenChange(MENU.fontSize)}
            menu={{ items: fontSizeMenuItems, onClick: handleFontSizeMenuClick }}
            >
            <Button icon={<FontSizeIcon />} className="WhiteboardToolbar-buttonWithSelection">
              <span className="WhiteboardToolbar-buttonWithSelectionText">
                {selectedFontSizeItem.label}
              </span>
            </Button>
          </Dropdown>
        </Tooltip>

        <Tooltip title={t('strokeWidthTooltip')} placement="bottom">
          <Dropdown
            trigger={['click']}
            placement="top"
            open={openMenu === MENU.strokeWidth}
            onOpenChange={() => handleMenuOpenChange(MENU.strokeWidth)}
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
          placement="top"
          open={openMenu === MENU.strokeColor}
          onOpenChange={() => handleMenuOpenChange(MENU.strokeColor)}
          content={
            <SwatchesPicker
              color={strokeColor}
              colors={DEFAULT_COLOR_SWATCHES}
              width={DEFAULT_COLOR_PICKER_WIDTH}
              onChange={handleStrokeColorChange}
              />
          }
          >
          <Tooltip title={t('strokeColorTooltip')} placement="bottom">
            <Button icon={<StrokeColorIcon />} className="WhiteboardToolbar-buttonWithSelection">
              <div className="WhiteboardToolbar-selectedColor" style={{ backgroundColor: strokeColor }} />
            </Button>
          </Tooltip>
        </Popover>

        <Popover
          trigger="click"
          placement="top"
          open={openMenu === MENU.fillColor}
          onOpenChange={() => handleMenuOpenChange(MENU.fillColor)}
          content={
            <Fragment>
              <SwatchesPicker
                color={fillColor}
                colors={DEFAULT_COLOR_SWATCHES}
                width={DEFAULT_COLOR_PICKER_WIDTH}
                onChange={handleFillColorChange}
                />
              <Button className="WhiteboardToolbar-removeColor" onClick={handleFillColorRemove}>
                {t('removeFillColor')}
              </Button>
            </Fragment>
          }
          >
          <Tooltip title={t('fillColorTooltip')} placement="bottom">
            <Button icon={<FillColorIcon />} className="WhiteboardToolbar-buttonWithSelection">
              <div className="WhiteboardToolbar-selectedColor" style={{ backgroundColor: fillColor }}>
                {fillColor === TRANSPARENT_FILL_COLOR && (
                  <div className="WhiteboardToolbar-selectedColorDiagonalLine" />
                )}
              </div>
            </Button>
          </Tooltip>
        </Popover>
      </div>
    </div>
  );
}

WhiteboardToolbar.propTypes = {
  mode: PropTypes.oneOf(Object.values(MODE)).isRequired,
  fontSize: PropTypes.oneOf(Object.values(FONT_SIZE)).isRequired,
  strokeWidth: PropTypes.oneOf(Object.values(STROKE_WIDTH)).isRequired,
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
  onResetClick: PropTypes.func.isRequired,
  onExportImageClick: PropTypes.func.isRequired,
};
