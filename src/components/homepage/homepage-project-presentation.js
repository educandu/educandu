import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { useService } from '../container-context.js';
import { useSettings } from '../settings-context.js';
import DefaultSiteLogo from '../default-site-logo.js';
import MediaPlayer from '../media-player/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import PdfIcon from '../icons/homepage-features/pdf-icon.js';
import TextIcon from '../icons/homepage-features/text-icon.js';
import RoomIcon from '../icons/homepage-features/room-icon.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
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
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('homepageProjectPresentation');

  const homepageSettings = settings?.homepagePresentation?.[uiLanguage];
  const aboutDocumentUrl = homepageSettings?.aboutDocumentId && routes.getDocUrl({ id: homepageSettings.aboutDocumentId });
  const videoSourceUrl = homepageSettings?.videoSourceUrl && getAccessibleUrl({ url: homepageSettings.videoSourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const videoPosterImageUrl = homepageSettings?.posterImageSourceUrl && getAccessibleUrl({ url: homepageSettings.posterImageSourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  const handleLearnMoreClick = () => {
    window.location = aboutDocumentUrl;
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
        <div className="HomepageProjectPresentation-featureLabel">
          {feature.label}
        </div>
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

        {!!aboutDocumentUrl && (
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
