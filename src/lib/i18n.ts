export type LanguageCode = "en" | "kn" | "tulu";

export interface TranslationDictionary {
  tagline: string;
  searchPlaceholder: string;
  allRegion: string;
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
    citizenDesk: string;
    liveNow: string;
    latestWire: string;
    trendingKaravali: string;
    pethriMoments: string;
    upcomingEvents: string;
    sponsoredPartner: string;
    breakingNews: string;
    readFullReport: string;
    openFeed: string;
    watchLive: string;
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
    drawer: {
      home: "Home",
      localNews: "Local News",
      communityFeed: "Community Feed",
      explore: "Explore",
      shareMoment: "Share a Moment",
      goLive: "Go Live",
      submitNews: "Submit News",
      profile: "Profile",
      saved: "Saved",
      settings: "Settings",
      editorialDesk: "Editorial Desk",
      eventsDirectory: "Events & Directory",
    },
    sections: {
      newsroomDispatch: "Verified Newsroom",
      citizenDesk: "Citizen Community Desk",
      liveNow: "Pethri Live",
      latestWire: "Karavali Wire",
      trendingKaravali: "Trending Across Karavali",
      pethriMoments: "Pethri Moments & Stories",
      upcomingEvents: "Upcoming Karavali Events",
      sponsoredPartner: "Sponsored Local Partner",
      breakingNews: "Breaking",
      readFullReport: "Read Full Report",
      openFeed: "Open Feed",
      watchLive: "Join Live",
    },
    actions: {
      follow: "Follow",
      following: "Following",
      reportNews: "Submit News",
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
    drawer: {
      home: "ಮುಖಪುಟ",
      localNews: "ಸ್ಥಳೀಯ ಸುದ್ದಿ",
      communityFeed: "ಸಮುದಾಯ ಫೀಡ್",
      explore: "ಅನ್ವೇಷಿಸಿ",
      shareMoment: "ಕ್ಷಣ ಹಂಚಿಕೊಳ್ಳಿ",
      goLive: "ಲೈವ್ ಪ್ರಸಾರ",
      submitNews: "ಸುದ್ದಿ ಕಳುಹಿಸಿ",
      profile: "ಪ್ರೊಫೈಲ್",
      saved: "ಉಳಿಸಿದವು",
      settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
      editorialDesk: "ಸಂಪಾದಕೀಯ ವಿಭಾಗ",
      eventsDirectory: "ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಡೈರೆಕ್ಟರಿ",
    },
    sections: {
      newsroomDispatch: "ಪರಿಶೀಲಿತ ಸುದ್ದಿ ವಿಭಾಗ",
      citizenDesk: "ನಾಗರಿಕ ವರದಿಗಳು",
      liveNow: "ಪೇತ್ರಿ ಲೈವ್",
      latestWire: "ಕರಾವಳಿ ಕ್ಷಣಕ್ಷಣದ ಸುದ್ದಿ",
      trendingKaravali: "ಕರಾವಳಿಯಲ್ಲಿ ಟ್ರೆಂಡಿಂಗ್",
      pethriMoments: "ಪೇತ್ರಿ ಕ್ಷಣಗಳು ಮತ್ತು ಕಥೆಗಳು",
      upcomingEvents: "ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು",
      sponsoredPartner: "ಪ್ರಾಯೋಜಿತ ಸ್ಥಳೀಯ ಪಾಲುದಾರರು",
      breakingNews: "ಬ್ರೇಕಿಂಗ್",
      readFullReport: "ಸಂಪೂರ್ಣ ವರದಿ ಓದಿ",
      openFeed: "ಫೀಡ್ ತೆರೆಯಿರಿ",
      watchLive: "ಲೈವ್ ವೀಕ್ಷಿಸಿ",
    },
    actions: {
      follow: "ಫಾಲೋ",
      following: "ಫಾಲೋ ಮಾಡಲಾಗಿದೆ",
      reportNews: "ಸುದ್ದಿ ಕಳುಹಿಸಿ",
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
