export type LanguageCode = "en" | "kn" | "tulu";

export interface TranslationDictionary {
  tagline: string;
  searchPlaceholder: string;
  allRegion: string;
  nav: {
    pulse: string;
    news: string;
    explore: string;
    events: string;
    submitTip: string;
    liveDesk: string;
    moments: string;
    civicReports: string;
    all: string;
  };
  drawer: {
    home: string;
    localNews: string;
    communityFeed: string;
    explore: string;
    shareMoment: string;
    goLive: string;
    submitNews: string;
    profile: string;
    saved: string;
    settings: string;
    editorialDesk: string;
    eventsDirectory: string;
  };
  sections: {
    newsroomDispatch: string;
    authorisedReporting: string;
    citizenDesk: string;
    liveNow: string;
    latestWire: string;
    nearbyDevelopments: string;
    trendingKaravali: string;
    pethriMoments: string;
    upcomingEvents: string;
    coastalCalendar: string;
    sponsoredPartner: string;
    breakingNews: string;
    readFullReport: string;
    openFeed: string;
    watchLive: string;
    allBeats: string;
    stories: string;
    events: string;
    localities: string;
    editorialIntake: string;
    encrypted: string;
    submitTipHeadline: string;
    submitTipDesc: string;
    accreditedStaff: string;
    allNews: string;
    allVerifiedStories: string;
    communityContributions: string;
    reviewedReports: string;
    viewAll: string;
    civicAdvisories: string;
    exploreTowns: string;
    openMap: string;
    paid: string;
    reactions: string;
    comments: string;
    editorialLabel: string;
    reviewedTipLabel: string;
    backToNews: string;
    communityDiscussion: string;
    relatedDispatches: string;
    moreFrom: string;
    writeComment: string;
    signInToComment: string;
    commentAction: string;
    posting: string;
    loadingStories: string;
    noMatchingStories: string;
  };
  actions: {
    follow: string;
    following: string;
    reportNews: string;
    createPost: string;
    like: string;
    share: string;
    save: string;
    going: string;
    interested: string;
  };
}

export const TRANSLATIONS: Record<"en" | "kn", TranslationDictionary> = {
  en: {
    tagline: "Karavali Hyperlocal Social News & Live Network",
    searchPlaceholder: "Search Mangaluru, Udupi, Manipal, Pethri...",
    allRegion: "All Karavali",
    nav: {
      pulse: "Pulse",
      news: "News",
      explore: "Explore",
      events: "Events",
      submitTip: "Submit Tip",
      liveDesk: "Live Desk",
      moments: "Moments",
      civicReports: "Civic Reports",
      all: "All",
    },
    drawer: {
      home: "Home",
      localNews: "Local News",
      communityFeed: "Community Discussions",
      explore: "Explore",
      shareMoment: "Share a Moment",
      goLive: "Go Live",
      submitNews: "Submit Private News Tip",
      profile: "Profile",
      saved: "Saved",
      settings: "Settings",
      editorialDesk: "Editorial Desk",
      eventsDirectory: "Events & Directory",
    },
    sections: {
      newsroomDispatch: "Verified Newsroom",
      authorisedReporting: "Authorised Newsroom Reporting",
      citizenDesk: "Citizen Community Desk",
      liveNow: "Pethri Live",
      latestWire: "Karavali Wire",
      nearbyDevelopments: "Nearby Developments",
      trendingKaravali: "Trending Across Karavali",
      pethriMoments: "Pethri Moments & Stories",
      upcomingEvents: "Upcoming Karavali Events",
      coastalCalendar: "Coastal Calendar",
      sponsoredPartner: "Sponsored Local Partner",
      breakingNews: "Breaking",
      readFullReport: "Read Full Report",
      openFeed: "Open Feed",
      watchLive: "Join Live",
      allBeats: "All Beats",
      stories: "Stories",
      events: "Events",
      localities: "Localities",
      editorialIntake: "Editorial Intake",
      encrypted: "Encrypted",
      submitTipHeadline: "Submit a Private Tip to Pethri Journalists",
      submitTipDesc:
        "Have evidence of local civic problems or breaking news? Submissions remain strictly private until editorial review.",
      accreditedStaff: "Accredited staff review",
      allNews: "All News",
      allVerifiedStories: "All Verified Stories",
      communityContributions: "Community Contributions",
      reviewedReports: "Reviewed Reports",
      viewAll: "View all",
      civicAdvisories: "Civic Advisories",
      exploreTowns: "Explore Towns",
      openMap: "Open Interactive Map",
      paid: "Paid",
      reactions: "reactions",
      comments: "comments",
      editorialLabel: "Editorial",
      reviewedTipLabel: "Reviewed Tip",
      backToNews: "Back to News & Discussions",
      communityDiscussion: "Community Discussion",
      relatedDispatches: "Related Dispatches",
      moreFrom: "More from",
      writeComment: "Write a comment...",
      signInToComment: "Join the discussion (sign in required)...",
      commentAction: "Comment",
      posting: "Posting...",
      loadingStories: "Loading verified local reporting…",
      noMatchingStories: "No verified articles match this filter yet.",
    },
    actions: {
      follow: "Follow",
      following: "Following",
      reportNews: "Submit Tip",
      createPost: "Create",
      like: "Like",
      share: "Share",
      save: "Save",
      going: "Going ✓",
      interested: "Interested",
    },
  },
  kn: {
    tagline: "ಕರಾವಳಿ ಸ್ಥಳೀಯ ಸುದ್ದಿ ಮತ್ತು ಸಮುದಾಯ ಜಾಲತಾಣ",
    searchPlaceholder: "ಮಂಗಳೂರು, ಉಡುಪಿ, ಮಣಿಪಾಲ, ಪೇತ್ರಿ ಹುಡುಕಿ...",
    allRegion: "ಸಂಪೂರ್ಣ ಕರಾವಳಿ",
    nav: {
      pulse: "ಪಲ್ಸ್",
      news: "ಸುದ್ದಿ",
      explore: "ಅನ್ವೇಷಿಸಿ",
      events: "ಕಾರ್ಯಕ್ರಮಗಳು",
      submitTip: "ಮಾಹಿತಿ ಕಳುಹಿಸಿ",
      liveDesk: "ಲೈವ್ ಡೆಸ್ಕ್",
      moments: "ಕ್ಷಣಗಳು",
      civicReports: "ನಾಗರಿಕ ವರದಿಗಳು",
      all: "ಎಲ್ಲಾ",
    },
    drawer: {
      home: "ಮುಖಪುಟ",
      localNews: "ಸ್ಥಳೀಯ ಸುದ್ದಿ",
      communityFeed: "ಸಮುದಾಯ ಚರ್ಚೆಗಳು",
      explore: "ಅನ್ವೇಷಿಸಿ",
      shareMoment: "ಕ್ಷಣ ಹಂಚಿಕೊಳ್ಳಿ",
      goLive: "ಲೈವ್ ಪ್ರಸಾರ",
      submitNews: "ಖಾಸಗಿ ಸುದ್ದಿ ಮಾಹಿತಿ ಕಳುಹಿಸಿ",
      profile: "ಪ್ರೊಫೈಲ್",
      saved: "ಉಳಿಸಿದವು",
      settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
      editorialDesk: "ಸಂಪಾದಕೀಯ ವಿಭಾಗ",
      eventsDirectory: "ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಡೈರೆಕ್ಟರಿ",
    },
    sections: {
      newsroomDispatch: "ಪರಿಶೀಲಿತ ಸುದ್ದಿ ವಿಭಾಗ",
      authorisedReporting: "ಅಧಿಕೃತ ಸುದ್ದಿ ವರದಿಗಳು",
      citizenDesk: "ನಾಗರಿಕ ವರದಿಗಳು",
      liveNow: "ಪೇತ್ರಿ ಲೈವ್",
      latestWire: "ಕರಾವಳಿ ಕ್ಷಣಕ್ಷಣದ ಸುದ್ದಿ",
      nearbyDevelopments: "ಸುತ್ತಮುತ್ತಲಿನ ಬೆಳವಣಿಗೆಗಳು",
      trendingKaravali: "ಕರಾವಳಿಯಲ್ಲಿ ಟ್ರೆಂಡಿಂಗ್",
      pethriMoments: "ಪೇತ್ರಿ ಕ್ಷಣಗಳು ಮತ್ತು ಕಥೆಗಳು",
      upcomingEvents: "ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು",
      coastalCalendar: "ಕರಾವಳಿ ವೇಳಾಪಟ್ಟಿ",
      sponsoredPartner: "ಪ್ರಾಯೋಜಿತ ಸ್ಥಳೀಯ ಪಾಲುದಾರರು",
      breakingNews: "ಬ್ರೇಕಿಂಗ್",
      readFullReport: "ಸಂಪೂರ್ಣ ವರದಿ ಓದಿ",
      openFeed: "ಫೀಡ್ ತೆರೆಯಿರಿ",
      watchLive: "ಲೈವ್ ವೀಕ್ಷಿಸಿ",
      allBeats: "ಎಲ್ಲಾ ವಿಭಾಗಗಳು",
      stories: "ಸುದ್ದಿಗಳು",
      events: "ಕಾರ್ಯಕ್ರಮಗಳು",
      localities: "ಪ್ರದೇಶಗಳು",
      editorialIntake: "ಸಂಪಾದಕೀಯ ಸ್ವೀಕಾರ",
      encrypted: "ಗೌಪ್ಯ",
      submitTipHeadline: "ಪೇತ್ರಿ ಪತ್ರಕರ್ತರಿಗೆ ಖಾಸಗಿ ಮಾಹಿತಿ ಕಳುಹಿಸಿ",
      submitTipDesc:
        "ಸ್ಥಳೀಯ ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳು ಅಥವಾ ಪ್ರಮುಖ ಸುದ್ದಿಗಳ ಪುರಾವೆ ಇದೆಯೇ? ಸಂಪಾದಕೀಯ ಪರಿಶೀಲನೆಯವರೆಗೆ ಎಲ್ಲಾ ಮಾಹಿತಿ ಸಂಪೂರ್ಣ ಖಾಸಗಿಯಾಗಿರುತ್ತದೆ.",
      accreditedStaff: "ಮಾನ್ಯತೆ ಪಡೆದ ಸಿಬ್ಬಂದಿ ಪರಿಶೀಲನೆ",
      allNews: "ಎಲ್ಲಾ ಸುದ್ದಿಗಳು",
      allVerifiedStories: "ಎಲ್ಲಾ ಪರಿಶೀಲಿತ ಸುದ್ದಿಗಳು",
      communityContributions: "ಸಮುದಾಯದ ಕೊಡುಗೆಗಳು",
      reviewedReports: "ಪರಿಶೀಲಿಸಿದ ವರದಿಗಳು",
      viewAll: "ಎಲ್ಲವನ್ನೂ ನೋಡಿ",
      civicAdvisories: "ನಾಗರಿಕ ಸೂಚನೆಗಳು",
      exploreTowns: "ಊರುಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
      openMap: "ನಕ್ಷೆ ತೆರೆಯಿರಿ",
      paid: "ಪ್ರಾಯೋಜಿತ",
      reactions: "ಪ್ರತಿಕ್ರಿಯೆಗಳು",
      comments: "ಕಾಮೆಂಟ್‌ಗಳು",
      editorialLabel: "ಸಂಪಾದಕೀಯ",
      reviewedTipLabel: "ಪರಿಶೀಲಿಸಿದ ಮಾಹಿತಿ",
      backToNews: "ಸುದ್ದಿ ಮತ್ತು ಚರ್ಚೆಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
      communityDiscussion: "ಸಮುದಾಯ ಚರ್ಚೆ",
      relatedDispatches: "ಸಂಬಂಧಿತ ವರದಿಗಳು",
      moreFrom: "ಇಲ್ಲಿಂದ ಇನ್ನಷ್ಟು:",
      writeComment: "ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಬರೆಯಿರಿ...",
      signInToComment: "ಚರ್ಚೆಯಲ್ಲಿ ಭಾಗವಹಿಸಿ (ಸೈನ್ ಇನ್ ಅಗತ್ಯವಿದೆ)...",
      commentAction: "ಕಾಮೆಂಟ್",
      posting: "ಪ್ರಕಟಿಸಲಾಗುತ್ತಿದೆ...",
      loadingStories: "ಪರಿಶೀಲಿತ ಸ್ಥಳೀಯ ಸುದ್ದಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…",
      noMatchingStories: "ಈ ಆಯ್ಕೆಗೆ ಯಾವುದೇ ಪರಿಶೀಲಿತ ಸುದ್ದಿಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    },
    actions: {
      follow: "ಫಾಲೋ",
      following: "ಫಾಲೋ ಮಾಡಲಾಗಿದೆ",
      reportNews: "ಮಾಹಿತಿ ಕಳುಹಿಸಿ",
      createPost: "ರಚಿಸಿ",
      like: "ಇಷ್ಟ",
      share: "ಹಂಚಿ",
      save: "ಉಳಿಸಿ",
      going: "ಹೋಗುತ್ತಿದ್ದೇನೆ ✓",
      interested: "ಆಸಕ್ತಿ",
    },
  },
};

export const LANGUAGE_OPTIONS: {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  available: boolean;
}[] = [
  { code: "en", label: "English", nativeLabel: "English", available: true },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", available: true },
  {
    code: "tulu",
    label: "Tulu (Architecture Ready)",
    nativeLabel: "ತುಳು (ಶೀಘ್ರದಲ್ಲೇ)",
    available: false,
  },
];

export function getDictionary(lang: LanguageCode): TranslationDictionary {
  return lang === "kn" ? TRANSLATIONS.kn : TRANSLATIONS.en;
}
