import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { useSettings } from '../settings-context.js';
import DefaultSiteLogo from '../default-site-logo.js';
import MediaPlayer from '../media-player/media-player.js';
import PdfIcon from '../icons/homepage-features/pdf-icon.js';
import TextIcon from '../icons/homepage-features/text-icon.js';
import RoomIcon from '../icons/homepage-features/room-icon.js';
import MediaIcon from '../icons/homepage-features/media-icon.js';
import ImageIcon from '../icons/homepage-features/image-icon.js';
import NotationIcon from '../icons/homepage-features/notation-icon.js';
import AnalysisIcon from '../icons/homepage-features/analysis-icon.js';
import MultitrackIcon from '../icons/homepage-features/multitrack-icon.js';
import EarTrainingIcon from '../icons/homepage-features/ear-training-icon.js';
import GamificationIcon from '../icons/homepage-features/gamification-icon.js';

function HomepageProjectPresentation({ logo }) {
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('homepageProjectPresentation');

  const aboutPageDocumentId = settings?.aboutPage?.[uiLanguage]?.documentId || 'cTfhXcxtkgqYLE3k1P6JAR';
  const videoSourceUrl = settings?.homepagePresentation?.[uiLanguage]?.video?.sourceUrl || 'https://cdn.openmusic.academy/document-media/cTfhXcxtkgqYLE3k1P6JAR/oma-explainer-vs1-0-pDjYtJexVC91WfrtWnu6hh.mp4';
  const videoPosterImageUrl = settings?.homepagePresentation?.[uiLanguage]?.video?.posterImageUrl || 'https://cdn.openmusic.academy/document-media/cTfhXcxtkgqYLE3k1P6JAR/explainer-poster-4c1tzNXqJyFbSYwaBL5EDz.jpg';

  const handleLearnMoreClick = () => {
    window.location = routes.getDocUrl({ id: aboutPageDocumentId });
  };

  const features = [
    { icon: <MediaIcon />, label: t('mediaFeature') },
    { icon: <EarTrainingIcon />, label: t('earTrainingFeature') },
    { icon: <MultitrackIcon />, label: t('multitrackFeature') },
    { icon: <PdfIcon />, label: t('pdfFeature') },
    { icon: <AnalysisIcon />, label: t('analysisFeature') },
    { icon: <TextIcon />, label: t('textFeature') },
    { icon: <ImageIcon />, label: t('imageFeature') },
    { icon: <RoomIcon />, label: t('roomFeature') },
    { icon: <NotationIcon />, label: t('notationFeature') },
    { icon: <GamificationIcon />, label: t('gamificationnFeature') }
  ];

  const renderFeature = (feature, index) => {
    return (
      <div className="HomepageProjectPresentation-feature" key={index}>
        <div className="HomepageProjectPresentation-featureIcon">
          {feature.icon}
        </div>
        {feature.label}
      </div>
    );
  };

  return (
    <div className="HomepageProjectPresentation">
      {!!videoSourceUrl && (
        <div className="HomepageProjectPresentation-videoWrapper">
          <div className="HomepageProjectPresentation-video">
            <MediaPlayer
              renderControls={() => null}
              renderProgressBar={() => null}
              sourceUrl={videoSourceUrl}
              posterImageUrl={videoPosterImageUrl}
              />
          </div>
        </div>
      )}
      <div className="HomepageProjectPresentation-details">
        {logo || <DefaultSiteLogo />}

        <div className="HomepageProjectPresentation-description">
          <Markdown>{t('descriptionMarkdown')}</Markdown>
        </div>

        <div className="HomepageProjectPresentation-features">
          {features.map(renderFeature)}
        </div>

        {!!aboutPageDocumentId && (
          <Button size="large" onClick={handleLearnMoreClick}>{t('learnMore')}</Button>
        )}
      </div>
    </div>
  );
}

HomepageProjectPresentation.propTypes = {
  logo: PropTypes.node
};

HomepageProjectPresentation.defaultProps = {
  logo: null
};

export default HomepageProjectPresentation;
