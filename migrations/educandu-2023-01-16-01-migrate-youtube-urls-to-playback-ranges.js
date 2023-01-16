const knownYoutubeDurationsInSeconds = {
  'N-cV-9ZUti0': 46,
  'qmY_aqyge14': 283,
  'nAapbue97JE': 2075,
  'c_i10rmmUsg': 177,
  'n-ky7wWAUgE': 348,
  'qjFgV7AvwUU': 1247,
  '7aLiT3wXko0': 0,
  'tjKCsSw1K2A': 181,
  'qkrrqTEH_zg': 269,
  'MerCZJHIejs': 141,
  'Fh36HesxlOs': 253,
  'oJQGPLXTJrs': 152,
  'Yy5cKX4jBkQ': 223,
  'vx2u5uUu3DE': 267,
  '6iC6K8fZDik': 0,
  'bpD_5I60lVY': 240,
  'wZ8eZRxFA-0': 184,
  'z1WsVinNBIA': 277,
  '0S13mP_pfEc': 141,
  'Ay7Wc97IP_A': 200,
  'MS0F8GtYP_8': 0,
  'U3rRkW35OWg': 344,
  'xvw66rtLpkg': 398,
  'ZKygz6NDlkg': 0,
  'FUuNjIE7Yqk': 205,
  'swv-3emSlBY': 170,
  'Vtlt_Vc9A3U': 1218,
  'C-THIU5Mu_I': 335,
  'UYUO8W7wVv8': 422,
  'mIZ53GcxwEo': 359,
  '6WDrEaK181s': 191,
  '_dV5b8AuLHg': 404,
  '4xdC0RNSe_Q': 140,
  'hyUDe-_l6xQ': 184,
  'vDEynk7SwxE': 412,
  'oSQy0JYqWik': 213,
  'E5vGCz8TYqk': 288,
  'ikf2v7Wp_pA': 576,
  'SAFjOcOv868': 1541,
  'EuW2WJFFh4c': 1501,
  'iNhMmyDFOLc': 445,
  '7QgT4_e8PTg': 971,
  'XQRYwe4KDDQ': 223,
  'csOekZrIm8k': 562,
  'SkVqJ1SGeL0': 151,
  'JOhiWY7XmoY': 90,
  'Z4C82eyhwgU': 147,
  '1Li0SWlwe34': 310,
  'vxo9TmhSpMk': 70,
  'chLZQtCold8': 819,
  'YqHxxJkwXOw': 186,
  '3XfWxeszXEI': 278,
  '-bTpp8PQSog': 326,
  'i-Qnw9_gfSo': 0,
  'aqz-KE-bpKQ': 635,
  '0J3X3Ey035k': 842,
  'L8UnDGLn5AY': 948,
  'uqrwbBVtW0o': 169,
  'NHzBFZmGsDo': 285,
  'z3ZX5hFN-is': 403,
  '5JH_-caeazs': 590,
  'pMrz-Vg59Yw': 248,
  'C9YBOeeYSvg': 252,
  'ixbcvKCl4Jc': 227,
  'CpKyFTYvhpU': 172,
  'CU6kp2x7XVA': 315,
  '71TipfLio28': 199,
  '3asWeutbY0c': 3134,
  'PEhrHXSxD4s': 276,
  'Mb3iPP-tHdA': 241,
  'nj8CzQF8oFE': 273,
  'GMkmQlfOJDk': 324,
  '5a3Vcm4nP14': 267,
  'ofEKXmuaXE0': 256,
  '7ZCG5XcYNSc': 550,
  'jiRbJ26qw5c': 2238,
  'szu13HgqGZk': 800,
  'juDCA8zAFgI': 1695,
  'klswkJlmiHk': 229,
  'vs3jUAMphpY': 245,
  'JyK3Q6WwYnE': 0,
  'nMN9Bw8Tnus': 135,
  'iKbMolqK-5M': 160,
  'DVlU7iQfffE': 253,
  'JemBI6xzyOs': 336,
  '4ble02T4lb8': 175,
  'x954-YKeGeo': 193,
  'EJBRyoBgkJE': 84,
  '2j5eq-6-l60': 1107,
  'oChIB6y05-0': 236,
  'Nntd2fgMUYw': 190,
  'AWpsOqh8q0M': 306,
  'AByfaYcOm4A': 216,
  'haECT-SerHk': 219,
  'Y56lpXvXbs0': 269,
  'luwAMFcc2f8': 236,
  'yyKFKY00NrI': 897,
  '6KUDs8KJc_c': 0,
  'u-u4AjBkplA': 187,
  'G4YCe4HnuNg': 747,
  'QG-B8inb9YE': 107,
  'GoWKHATkgr8': 0,
  'lBn8YGR5O_Y': 242,
  'lZD4ezDbbu4': 0,
  'LMcDg2HwOnM': 287,
  '93fAJe8WVjA': 211,
  'EDb303T-B1w': 147,
  'jiimVjS2DHo': 266,
  'e-2251_at-k': 236,
  '1uuorcrtmNY': 267,
  '1tQKW9aquT0': 202,
  'vQN_DTqHNqo': 318,
  'JLDsLeVxOaU': 257,
  'yYiPIc9KYAw': 350,
  'HDYmHZkkzcI': 113,
  '9pxyAr3DxaU': 1611,
  'G3iVEb8ujQk': 339,
  '_HX_jF1_Tgc': 1898,
  'fTtgVSxfr5M': 241,
  'ol0dPJdzm1M': 363,
  'UFl9xuYP5T8': 2553,
  'PZ307sM0t-0': 310,
  'DBJPVnJ8m-Y': 844,
  '2ckqOukGKK8': 3597,
  'wSs-2NDG4Ao': 1583,
  'Z2CZn966cUg': 218,
  'ulFtxOL0FeQ': 777,
  't-RbXCm-FOI': 386,
  'oYdnUHCpomQ': 219,
  'eegDWPtk37c': 226,
  'IhSJFGcvxn4': 388,
  'roU3Qv5FdaE': 970,
  'J9866zX07iw': 848,
  'AuiBTUfehA0': 269,
  'zMxADNtodwA': 396,
  'IozekFVaTgg': 424,
  'dLFqUmnrPaQ': 1044,
  'M0y9n49Z4PA': 495,
  'HdgJrirl7fg': 0,
  'Lx5weckc7us': 199,
  'I4i1KcqWikY': 172,
  'mQER0A0ej0M': 426,
  'slfX7N73X1w': 151,
  'G-n5p8U0nLg': 399,
  'CjnkFLmatfM': 697,
  'xWFliBt-FFk': 819,
  'D08uGtMPYYI': 781,
  'v3XAca579E8': 1204,
  '_tjYr8PHmYo': 201,
  'w-OhlV-LSTY': 1252,
  'PXSDPG8-33E': 225,
  'VUR6kW-Gfh0': 352,
  '71hNl_skTZQ': 233,
  'GmXEl5XeHWc': 434,
  'tEN9i4ItSZw': 524,
  'iOD2tvNuzig': 0,
  'algM0c_u99k': 158,
  'yM8CFR01KwQ': 2050,
  'tHMDM6L9MIU': 400,
  'D3LUX6YFY8A': 433,
  '9umvR9_3peQ': 56,
  'KwtAMGXyTI4': 1782,
  'ZwVW1ttVhuQ': 9872,
  'ozEfJugPMe4': 434,
  'XAzn7cfNS-c': 744,
  '5p4jwd4lUCQ': 947,
  'YlLdGlaO4gk': 387,
  'e-LKnxivGxI': 200,
  'EYuTUkjjlNc': 294,
  'vlB1HR4BgUg': 1763,
  '69TC8V5wPC0': 0,
  'xSWJBClrmgo': 257,
  'R5LtP_8qKfg': 184,
  'CzbJDZDPW_o': 191,
  'lpipcap1R40': 161,
  'TYSFGT7UGS8': 242,
  'R1xM-r4TF6Q': 134,
  '5-O0j4dx968': 0,
  'LPPnmdqPbVM': 0,
  'x2KRpRMSu4g': 307,
  'CjS5TxzjY6s': 129,
  'QImFm4Y_QPM': 1528,
  '5FL99NMVk2o': 261,
  'a4r1IZMSVY8': 434,
  'ZixdOZh7zo4': 842,
  '31Q1bgpaF18': 1087,
  'kVwEkgQ3dPs': 1103,
  'OXeZ88M-MpE': 0,
  'TDbHKdycows': 153,
  'FbNrKMyoSEg': 266,
  'TYs3DKZ1QZM': 146,
  '9RbddbJTOXM': 213,
  'qoWdtGUe5fc': 1410,
  'Awosntv-AKg': 200,
  'B7SXc76qqXI': 176,
  '3itGsEpsfbg': 167,
  '3hj-7Dnh7zM': 2632,
  'IywXC0KsEWQ': 187,
  'AnMsF-dzgAY': 36,
  '_nUdoDIdSaU': 1648,
  'PGylhtcmomk': 172,
  'FImbrKgW8cs': 206,
  'uIYmajo2I5o': 254,
  'H6msDKxC_9I': 127,
  'DUQiu4xa1lg': 362,
  '6NRoeyVYedA': 885,
  'Mw8IeMX9ACI': 356,
  'UBHohect_-4': 0,
  'nAJpRni-Sic': 3602,
  '8swLZXqVKCM': 404,
  'lj8Oe7xFAcw': 255,
  '_jAJ2jGXw50': 585,
  'XdZg5PZk88Y': 450,
  'XdZg5PZk88Ystart=258': 0,
  'vDDDQ20aBEs': 10392,
  'TvnYmWpD_T8': 478,
  'eCFx0TX4rxk': 608,
  'x0Fd-UM-YdY': 320,
  'XAxyas7t32Y': 1851,
  'zvliYrOLYDk': 718,
  'LFJPReaVNYQ': 972,
  'aqPDbgCKnhA': 288,
  'XUhjIoDC7Pg': 271,
  '0VlnyvlKpRw': 236,
  'CGfKi6kpdTQ': 257,
  '3OzAo1lsvr8': 0,
  'wGiTPgvKktM': 342,
  'EQPCBYjcbYw': 210,
  'uDPn8w65coI': 380,
  'YJVmu6yttiw': 219,
  'pYGYm9-mavE': 279,
  '2Fnh0Cf6YaE': 170,
  '2IOQoxwxbpg': 0,
  'SJOKlqJho8U': 183,
  'jdLzLqcdMa0': 1061,
  'x-pZ8faa2ew': 673,
  '3n8XdKkrqgo': 279,
  'PCx_wTak9HI': 180,
  'H8HWZHLgbls': 405,
  'Lt8ktxo4kqE': 276,
  'TSYxtJgwSLI': 157,
  'L8WERExQCJE': 210,
  'OzIRDFOrnyo': 308,
  'qF8-ijUYWU0': 258,
  '-61ml-Qz8aU': 809,
  'eQGWlp2a17Y': 746,
  'tLW8CS7K4bI': 1009,
  'lbblMw6k1cU': 1426,
  'pw7izXch19M': 1810,
  '3FLbiDrn8IE': 6523,
  'LRRNEjyXbPU': 374,
  'avd45BMdnBQ': 231,
  '0Gl2QnHNpkA': 218,
  '4fndeDfaWCg': 220,
  '_C4C06ZmanA': 1604,
  'VNrEbG6sZIQ': 1430,
  'gJLIiF15wjQ': 236,
  'CevxZvSJLk8': 270,
  'Ei8UnOPJX7w': 296,
  '6hzrDeceEKc': 280,
  'WVe80iZtlYU': 235,
  'QVQjSisBLRk': 207,
  'QL14TuFKTwU': 808,
  'ZKs1WpMJ0X8': 1348,
  '49oiE8Tj1UU': 897,
  'L37qHfYBZ_4': 89,
  '8YzabSdk7ZA': 249,
  'eH3giaIzONA': 315,
  'WFCYhqvYrYY': 795,
  '2tr1CiMeP1g': 214,
  'GuMzYleEPRE': 3164,
  'yUJVWTQei24': 353,
  'N1cexwLOvtY': 2168,
  'vZoyRrTE6kk': 563,
  'Tfe8jlNskTs': 179,
  'o0OU6ixUF2E': 583,
  'V-s5nqZBCrw': 184,
  'Eo-KmOd3i7s': 239,
  '0l0VAyjROjM': 1846,
  'CUv3rRUUWWw': 1299,
  'NWkQwASn-Uk': 513,
  'Aky7A7tp4Rck': 0,
  'NuQcFC8rink': 1651,
  'ZMEBZwoBAFo': 1465,
  '3uj8P9G3OAU': 1124,
  'X3j5f9ggN-4': 1426,
  'mfVWOcOWn84': 909,
  'EWyvDAzvRiI': 5457,
  's-AtQ9IslcY': 1528,
  'jUep3sqe35o': 5707,
  '81MY2pwKDu4': 171,
  'flA5ndOyZbI': 216,
  'iPg69CycZp0': 802,
  'xyqvoK6RXnQ': 342,
  'NLTNyhpMEEM': 271,
  'X2hu-_yOzBA': 186,
  'rNCKPt0ghqs': 233,
  'FTdLZrsaqrM': 726,
  '5cDfodNuVb4': 250,
  '3TGz_mNO6KQ': 133,
  '7wRHBLwpASw': 254,
  'cELBtOexOOo': 223,
  '8mkmUdUYgH0': 239,
  'XWE-ujTSXP4': 217,
  'u7XjPmN-tHw': 221,
  'S9tKwSboJeg': 226,
  'YaCFtEELNpo': 355,
  'XRPwNU3f3Tw': 262,
  'i7fnlJ60RO8': 229,
  '_ZgBEytmzZQ': 254,
  'TIUwLfpufs0': 272,
  'hBp4dgE7Bho': 218,
  'm4OnAwaDVTE': 269,
  'NVIpECtQfNM': 291,
  'ozXZnwYTMbs': 389,
  'vqhqGnQcKJY': 345,
  'xsNX0UHv2U0': 1405,
  'vg4ytXm1Tbc': 77,
  'YWtS9BDu410': 8980,
  'Hnd5ULYG2no': 10233,
  '5BBnMCAIuQg': 0,
  'ZMIxckOVhqU': 168,
  '-xLe-TaZ49M': 254,
  'm_m2oYJkx1A': 235,
  'UNPKGyYzPCo': 272,
  'ywfX9yIeG8s': 184,
  'PRCY-mDAHbw': 3680,
  '0oOY6fkZ3gM': 1569,
  'GTI5N7fIVQ4': 282,
  '6RbKWhr0o1c': 2162,
  'hKHfRV19hw8': 1065,
  'o5052SCKvmw': 487,
  '3UQs0r56Wwo': 380,
  'WxI-v-4aYvY': 415,
  'WWPkYPfzsn0': 388,
  'ikNYP6H7Ilw': 1563,
  'z2iQYa2dOmo': 359,
  'XBWVJ-h6rCo': 353,
  'tBY3FPshUc4': 307,
  'qzcqKxKoV20': 264,
  'Or3yKaIO_HU': 448,
  'pz4P9lKA-5A': 234,
  'oLzQbyWfBnY': 812,
  'SaBzNtvjI_0': 261,
  'ZDyEERuK31Y': 157,
  'LnbfgknFUeU': 560,
  'bDjU7L5eas0': 305,
  'Jyfu30U2E9k': 838,
  'a3qeJ9dxsg0': 319,
  'u7XQ2YU2EFM': 244,
  'OflP45UjgBU': 327,
  '0FqCqwaoXVg': 710,
  'L7qEDB8shdo': 253,
  'bs1_gB1Y--I': 266,
  'rsyA6m7VZiw': 991,
  'DkkgYiGupR0': 237,
  'NN6DnID3B8E': 289,
  'hHO3pN_l2fE': 224,
  'wj0Vi7ie17U': 131,
  'cDi1mpiQYY8': 221,
  'r_Cs9Bt8ZB8': 46,
  'O3DbqTvgX9w': 758,
  'f29XKjl7NXA': 856,
  'T5QrYPRFtsw': 520,
  'jOofzffyDSA': 3053,
  '4IQahsvQT4Y': 0,
  'Q8-IWNQHxps': 465,
  'kHTw-grjORk': 786,
  'wcobxmwCTys': 1135,
  '4umPLu-Dru8': 1857,
  'buSf08n361o': 1710,
  'eka8yscjE3g': 779,
  'ikFFVfObwss': 209,
  '6j6-elqb2Wc': 286,
  'WH40KKypNys': 996,
  'eVTXPUF4Oz4': 219,
  'mNaT0t67E14': 236,
  'JYJ6QJqy92s': 314,
  'FkbKdeB-jMU': 363,
  'MKYZ1NTfc7Q': 192,
  '_2zc0wTORSI': 248,
  'rMMQc6Pk73E': 149,
  '96pW-o2tzjA': 177,
  'CwED4C5FJuo': 236,
  'sTbk3SfUq9Q': 326,
  'jvxDdgwaCyI': 265,
  'GVshywB0f5s': 167,
  'N1FUw5whO-4': 1740,
  'kcfDxgfHs64': 2353,
  'h1HgO5pza24': 527,
  'SW9RrOLoYE0': 1361,
  'vzf5-WZyL1c': 1183,
  'Gkk_s1n5I6s': 424,
  's-KDzAYOroI': 1513,
  'QaBrjn3Nn6M': 1608,
  'ikQNFqVkNNc': 268,
  '5nBAI1y6A68': 1108,
  'pAI4-9yc6kA': 3604,
  'LB47COJ5IRA': 1313,
  'xTNbclgU3h4': 1849,
  '5xDTfxBWNOY': 321,
  'du9IK5m8UeY': 865,
  'NTBrv_tXt4w': 240,
  'jmm2hMDLOoU': 839,
  'rLWtDLycT3Q': 219,
  'NeCINrWKG_M': 224,
  'qocuJ4QzOW0': 290,
  '5hNSbRhAZlA': 325,
  'Bhpsql6tWkE': 6778,
  'uMPFEXq1eSU': 1205,
  'Gy3BOmvLf2w': 256,
  '8zSODUOoE8w': 285,
  'beWvPkYHaic': 249,
  'iUVwkrqt7n4': 274,
  'n3u1ikyObKk': 773
};

const knownYoutubeIds = Object.keys(knownYoutubeDurationsInSeconds);

const parseTimeInSeconds = timeText => {
  const matches = (timeText || '').match(/(\d+h)?(\d+m)?(\d+s?)?/);
  if (!matches[0]) {
    return 0;
  }
  const hoursText = matches[1] ? matches[1].replace('h', '') : '0';
  const minutesText = matches[2] ? matches[2].replace('m', '') : '0';
  const secondsText = matches[3] ? matches[3].replace('s', '') : '0';

  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);
  const seconds = Number.parseInt(secondsText, 10);

  const timeInSeconds = (Number.isInteger(hours) ? hours * 60 * 60 : 0)
  + (Number.isInteger(minutes) ? minutes * 60 : 0)
  + (Number.isInteger(seconds) ? seconds : 0);

  return timeInSeconds;
};

const tryGetYoutubeVideoInfo = url => {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    parsedUrl = null;
  }

  if (parsedUrl?.origin === 'https://www.youtube.com' && parsedUrl?.pathname === '/watch' && parsedUrl?.searchParams.has('v')) {
    const videoId = parsedUrl.searchParams.get('v');
    const startSecond = parseTimeInSeconds(parsedUrl.searchParams.get('start'));
    const endSecond = parseTimeInSeconds(parsedUrl.searchParams.get('end'));
    return { videoId, startSecond, endSecond };
  }

  if (parsedUrl?.origin === 'https://youtu.be' && !parsedUrl?.pathname?.slice(1).includes('/')) {
    const videoId = parsedUrl.pathname.slice(1);
    const startSecond = parseTimeInSeconds(parsedUrl.searchParams.get('t'));
    return { videoId, startSecond, endSecond: null };
  }

  return null;
};

const updateIfApplicable = (collectionName, docId, contentObject) => {
  if (!contentObject?.sourceUrl) {
    return false;
  }

  const youtubeVideoInfo = tryGetYoutubeVideoInfo(contentObject.sourceUrl);
  const isYoutubeVideo = !!youtubeVideoInfo?.videoId;
  const hasStartOrEndTime = youtubeVideoInfo?.startSecond || youtubeVideoInfo?.endSecond;

  if (!isYoutubeVideo || !hasStartOrEndTime) {
    return false;
  }

  if (!knownYoutubeIds.find(id => id === youtubeVideoInfo.videoId)) {
    console.log(`Unhandled case in ${collectionName}, _id '${docId}', sourceUrl '${contentObject.sourceUrl}'`);
    return false;
  }

  const originalUrl = contentObject.sourceUrl;
  const durationInSeconds = knownYoutubeDurationsInSeconds[youtubeVideoInfo.videoId];
  const sanitizedYoutubeUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeVideoInfo.videoId)}`;

  contentObject.sourceUrl = sanitizedYoutubeUrl;
  contentObject.playbackRange = [
    durationInSeconds && youtubeVideoInfo.startSecond ? youtubeVideoInfo.startSecond / durationInSeconds : 0,
    durationInSeconds && youtubeVideoInfo.endSecond ? youtubeVideoInfo.endSecond / durationInSeconds : 1
  ];

  console.log(`Updated ${collectionName}, _id '${docId}', sourceUrl '${originalUrl}', start ${youtubeVideoInfo.startSecond}, end ${youtubeVideoInfo.endSecond}, duration ${durationInSeconds} -> range '${JSON.stringify(contentObject.playbackRange)}'`);
  return true;
};

export default class Educandu_2023_01_16_01_migrate_youtube_urls_to_playback_ranges {
  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName) {
    const targetedDocs = await this.db.collection(collectionName)
      .find({ 'sections.type': { $in: ['audio', 'video', 'ear-training', 'matching-cards'] } })
      .toArray();

    let updateCount = 0;
    for (const doc of targetedDocs) {
      let docWasUpdated = false;

      for (const section of doc.sections) {
        const isTargetedSection = ['audio', 'video', 'ear-training', 'matching-cards'].includes(section.type) && !!section.content;
        if (isTargetedSection && updateIfApplicable(collectionName, doc._id, section.content)) {
          docWasUpdated = true;
        }

        if (isTargetedSection && section.content.tilePairs) {
          for (const pair of section.content.tilePairs) {
            for (const tile of pair) {
              if (updateIfApplicable(collectionName, doc._id, tile)) {
                docWasUpdated = true;
              }
            }
          }
        }
      }

      if (docWasUpdated) {
        updateCount += 1;
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }

    return updateCount;
  }

  async up() {
    const affectedDocumentsCount = await this.processCollection('documents');
    const affectedDocumentRevisionsCount = await this.processCollection('documentRevisions');

    console.log(`Finished updating ${affectedDocumentsCount} documents and ${affectedDocumentRevisionsCount} documentRevisions.`);
  }

  down() {
    throw Error('Not supported');
  }
}
