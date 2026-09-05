import React, { useState, useEffect } from 'react';
import {
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Chip,
  Box,
  Divider,
  IconButton,
  Collapse,
  Badge,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { SECTORS, PROVINCES, PROGRAM_TYPES, CITIES } from '../constants/filters';
import useFilters from '../hooks/useFilters';

const AccordionSection = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
          px: 1,
          cursor: 'pointer',
          minHeight: '44px',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
          <span role="img" aria-label={title} style={{ marginRight: '8px', fontSize: '1.2rem' }}>{icon}</span>
          {title}
        </Typography>
        <IconButton size="small" sx={{ minWidth: '44px', minHeight: '44px' }}>
          {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={isOpen}>
        <Box sx={{ px: 1, pb: 2 }}>{children}</Box>
      </Collapse>
      <Divider />
    </Box>
  );
};

const MobileFilterModal = ({ isOpen, onClose, filters, onFilterChange, activeFilterCount }) => {
  const {
    localFilters,
    handleChipToggle,
    handleCheckboxChange,
    clearAll,
    resetTo,
  } = useFilters(filters);

  useEffect(() => {
    resetTo(filters);
  }, [filters, resetTo]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleApply = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleClearAll = () => {
    clearAll();
    onFilterChange({ programType: [], location: [], sector: [], province: [], admissionOpen: false });
  };

  if (!isOpen) return null;

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 0 }}
        onClick={onClose}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          mt: 'auto',
          maxHeight: '85vh',
          bgcolor: 'background.paper',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            Filters
            {activeFilterCount > 0 && <Badge badgeContent={activeFilterCount} color="primary" sx={{ ml: 1 }} />}
          </Typography>
          <IconButton onClick={onClose} sx={{ minWidth: '44px', minHeight: '44px' }} aria-label="Close filters">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2 }}>
          {activeFilterCount > 0 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Active Filters:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {localFilters.sector.map((s) => (
                  <Chip key={`sector-${s}`} label={s} size="medium" onDelete={() => handleChipToggle('sector', s)} deleteIcon={<ClearIcon fontSize="small" />} sx={{ minHeight: '36px' }} />
                ))}
                {localFilters.province.map((p) => (
                  <Chip key={`prov-${p}`} label={p} size="medium" onDelete={() => handleChipToggle('province', p)} deleteIcon={<ClearIcon fontSize="small" />} sx={{ minHeight: '36px' }} />
                ))}
                {localFilters.location.map((c) => (
                  <Chip key={`city-${c}`} label={c} size="medium" onDelete={() => handleChipToggle('location', c)} deleteIcon={<ClearIcon fontSize="small" />} sx={{ minHeight: '36px' }} />
                ))}
                {localFilters.programType.map((pt) => (
                  <Chip key={`prog-${pt}`} label={pt} size="medium" onDelete={() => handleChipToggle('programType', pt)} deleteIcon={<ClearIcon fontSize="small" />} sx={{ minHeight: '36px' }} />
                ))}
                {localFilters.admissionOpen && (
                  <Chip label="Admission Open" size="medium" onDelete={() => handleCheckboxChange({ target: { name: 'admissionOpen', checked: false } })} deleteIcon={<ClearIcon fontSize="small" />} sx={{ minHeight: '36px' }} />
                )}
              </Box>
            </Box>
          )}

          <AccordionSection title="Admission" icon="🎓" defaultOpen={localFilters.admissionOpen}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={localFilters.admissionOpen} onChange={handleCheckboxChange} name="admissionOpen" color="success" sx={{ '& .MuiSvg-root': { fontSize: 24 } }} />}
                label={<Typography variant="body1">Open Only</Typography>}
                sx={{ minHeight: '44px' }}
              />
            </FormGroup>
          </AccordionSection>

          <AccordionSection title="Sector" icon="🏢" defaultOpen={localFilters.sector.length > 0}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {SECTORS.map((s) => (
                <Chip key={s} label={s} size="medium" clickable color={localFilters.sector.includes(s) ? 'primary' : 'default'} onClick={() => handleChipToggle('sector', s)} sx={{ minHeight: '40px', fontSize: '0.95rem', px: 1 }} />
              ))}
            </Box>
          </AccordionSection>

          <AccordionSection title="Province" icon="🗺️" defaultOpen={localFilters.province.length > 0}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {PROVINCES.map((p) => (
                <Chip key={p} label={p} size="medium" clickable color={localFilters.province.includes(p) ? 'primary' : 'default'} onClick={() => handleChipToggle('province', p)} sx={{ minHeight: '40px', fontSize: '0.95rem', px: 1 }} />
              ))}
            </Box>
          </AccordionSection>

          <AccordionSection title="Program Types" icon="📚" defaultOpen={localFilters.programType.length > 0}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {PROGRAM_TYPES.map((pt) => (
                <Chip key={pt} label={pt} size="medium" clickable color={localFilters.programType.includes(pt) ? 'primary' : 'default'} onClick={() => handleChipToggle('programType', pt)} sx={{ minHeight: '40px', fontSize: '0.95rem', px: 1 }} />
              ))}
            </Box>
          </AccordionSection>

          <AccordionSection title="Major Cities" icon="🏙️" defaultOpen={localFilters.location.length > 0}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {CITIES.map((c) => (
                <Chip key={c} label={c} size="medium" clickable color={localFilters.location.includes(c) ? 'primary' : 'default'} onClick={() => handleChipToggle('location', c)} sx={{ minHeight: '40px', fontSize: '0.95rem', px: 1 }} />
              ))}
            </Box>
          </AccordionSection>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 2, bgcolor: 'background.paper' }}>
          <Button variant="outlined" onClick={handleClearAll} disabled={activeFilterCount === 0} sx={{ flex: 1, minHeight: '48px', fontSize: '1rem' }}>
            Clear All
          </Button>
          <Button variant="contained" onClick={handleApply} sx={{ flex: 2, minHeight: '48px', fontSize: '1rem' }}>
            Apply Filters
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MobileFilterModal;
