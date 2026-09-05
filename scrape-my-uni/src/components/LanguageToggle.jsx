import React from 'react';
import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
  const { lang, toggleLanguage } = useLanguage();
  
  return (
    <Tooltip title={lang === 'en' ? 'اردو میں تبدیل کریں' : 'Switch to English'}>
      <IconButton
        onClick={toggleLanguage}
        sx={{
          bgcolor: 'background.paper',
          boxShadow: 2,
          width: 44,
          height: 44,
          fontWeight: 'bold',
          fontSize: '0.85rem',
        }}
      >
        {lang === 'en' ? 'اردو' : 'EN'}
      </IconButton>
    </Tooltip>
  );
};

export default LanguageToggle;
