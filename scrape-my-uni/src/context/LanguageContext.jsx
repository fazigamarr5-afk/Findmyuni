import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    // Navigation
    home: 'Home',
    universities: 'Universities',
    compare: 'Compare',
    deadlines: 'Deadlines',
    dashboard: 'Dashboard',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    blog: 'Blog',
    about: 'About',
    contact: 'Contact',
    myProfile: 'My Profile',
    adminPanel: 'Admin Panel',
    
    // Home
    heroTitle: 'Find Your Perfect University',
    heroSubtitle: 'Explore admissions, compare programs, and discover your path to higher education',
    searchPlaceholder: 'Search for universities, programs, or locations',
    browseAll: 'BROWSE ALL UNIVERSITIES',
    openAdmissions: 'Open Admissions',
    viewAll: 'VIEW ALL',
    
    // University Detail
    about: 'About',
    programs: 'Programs',
    scholarships: 'Scholarships',
    rankings: 'Rankings',
    facilities: 'Campus Facilities',
    reviews: 'Student Reviews',
    applyNow: 'Apply Now',
    visitWebsite: 'Visit Website',
    backToAll: '← Back to All Universities',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites',
    
    // Filters
    filters: 'Filters',
    public: 'Public',
    private: 'Private',
    sector: 'Sector',
    location: 'Location',
    
    // Common
    loading: 'Loading...',
    noResults: 'No results found',
    daysLeft: 'days left',
    deadlinePassed: 'Deadline Passed',
    admissionOpen: 'Admission Open',
    
    // Deadlines
    deadlineTitle: 'Admission Deadline Calendar',
    deadlineSubtitle: 'Track application deadlines across Pakistani universities',
    upcomingDeadlines: 'Upcoming Deadlines',
    
    // Compare
    compareTitle: 'Compare Universities',
    compareSubtitle: 'Select universities to compare their key metrics',
    
    // Reviews
    writeReview: 'Write a Review',
    editReview: 'Edit Your Review',
    yourRating: 'Your Rating',
    yourReview: 'Your Review',
    pros: 'Pros (what you liked)',
    cons: 'Cons (what could improve)',
    submitReview: 'Submit Review',
    loginToReview: 'Log in to write a review',
  },
  ur: {
    // Navigation
    home: 'گھر',
    universities: 'یونیورسٹیاں',
    compare: 'موازنہ',
    deadlines: 'ڈیڈ لائنز',
    dashboard: 'ڈیش بورڈ',
    login: 'لاگ ان',
    signup: 'سائن اپ',
    logout: 'لاگ آؤٹ',
    blog: 'بلاگ',
    about: 'ہمارے بارے میں',
    contact: 'رابطہ',
    myProfile: 'میری پروفائل',
    adminPanel: 'ایڈمن پینل',
    
    // Home
    heroTitle: 'اپنی مثالی یونیورسٹی تلاش کریں',
    heroSubtitle: 'داخلوں کو دیکھیں، پروگرامز کا موازنہ کریں، اعلیٰ تعلیم کا اپنا راستہ تلاش کریں',
    searchPlaceholder: 'یونیورسٹیاں، پروگرامز، یا مقامات تلاش کریں',
    browseAll: 'تمام یونیورسٹیاں دیکھیں',
    openAdmissions: 'کھلے داخلے',
    viewAll: 'سب دیکھیں',
    
    // University Detail
    about: 'بارے میں',
    programs: 'پروگرامز',
    scholarships: 'اسکالرشپ',
    rankings: 'درجہ بندی',
    facilities: 'کیمپس سہولیات',
    reviews: 'طلباء کے جائزے',
    applyNow: 'ابھی درخواست دیں',
    visitWebsite: 'ویب سائٹ دیکھیں',
    backToAll: '← تمام یونیورسٹیاں پر واپس',
    addFavorite: 'پسندیدہ میں شامل کریں',
    removeFavorite: 'پسندیدہ سے ہٹائیں',
    
    // Filters
    filters: 'فلٹرز',
    public: 'عوامی',
    private: 'نیجی',
    sector: 'شعبہ',
    location: 'مقام',
    
    // Common
    loading: 'لوڈ ہو رہا ہے...',
    noResults: 'کوئی نتائج نہیں ملے',
    daysLeft: 'دن باقی',
    deadlinePassed: 'ڈیڈ لائن ختم ہو گئی',
    admissionOpen: 'داخلہ کھلا',
    
    // Deadlines
    deadlineTitle: 'داخلہ ڈیڈ لائن کیلنڈر',
    deadlineSubtitle: 'پاکستان کی یونیورسٹیوں کی داخلہ ڈیڈ لائنز پر نظر رکھیں',
    upcomingDeadlines: 'آنے والی ڈیڈ لائنز',
    
    // Compare
    compareTitle: 'یونیورسٹیوں کا موازنہ',
    compareSubtitle: 'یونیورسٹیاں منتخب کریں',
    
    // Reviews
    writeReview: 'جائزہ لکھیں',
    editReview: 'اپنا جائزہ ترمیم کریں',
    yourRating: 'آپ کی ریٹنگ',
    yourReview: 'آپ کا جائزہ',
    pros: 'فائدے (جو آپ کو پسند آیا)',
    cons: 'نقائص (کیا بہتر ہو سکتا ہے)',
    submitReview: 'جائزہ جمع کریں',
    loginToReview: 'جائزہ لکھنے کے لیے لاگ ان کریں',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  
  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ur' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };
  
  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  
  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
