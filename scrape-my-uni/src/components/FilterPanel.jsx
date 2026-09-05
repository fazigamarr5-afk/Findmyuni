import React, { useState, useEffect } from 'react';
import {
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Divider,
  Button,
  Chip,
  Box,
  Grid,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { SECTORS, PROVINCES, PROGRAM_TYPES, CITIES } from '../constants/filters';
import useFilters from '../hooks/useFilters';

const FilterPanel = ({ filters, onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState([]);

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
    updateActiveFilters();
  }, [localFilters]);

  // Auto-apply filters whenever they change
  useEffect(() => {
    // Skip the initial render
    const isInitialRender = 
      localFilters.programType.length === 0 && 
      localFilters.location.length === 0 && 
      localFilters.sector.length === 0 &&
      localFilters.province.length === 0 &&
      !localFilters.admissionOpen;
    
    if (!isInitialRender) {
      applyFilters();
    }
  }, [localFilters]);

  const updateActiveFilters = () => {
    const newActiveFilters = [];
    if (localFilters.programType.length > 0) newActiveFilters.push(`Programs: ${localFilters.programType.length} selected`);
    if (localFilters.location.length > 0) newActiveFilters.push(`Cities: ${localFilters.location.length} selected`);
    if (localFilters.sector.length > 0) newActiveFilters.push(`Sectors: ${localFilters.sector.length} selected`);
    if (localFilters.province.length > 0) newActiveFilters.push(`Provinces: ${localFilters.province.length} selected`);
    if (localFilters.admissionOpen) newActiveFilters.push('Admission Open');
    setActiveFilters(newActiveFilters);
  };

  const applyFilters = () => {
    if (typeof onFilterChange === 'function') {
      onFilterChange({ ...localFilters });
    }
  };

  const handleClearFilters = () => {
    clearAll();
    if (typeof onFilterChange === 'function') {
      onFilterChange({ programType: [], location: [], sector: [], province: [], admissionOpen: false });
    }
  };

  const handleRemoveFilter = (filter) => {
    if (filter.includes('Programs:')) {
      resetTo({ ...localFilters, programType: [] });
    } else if (filter.includes('Cities:')) {
      resetTo({ ...localFilters, location: [] });
    } else if (filter.includes('Sectors:')) {
      resetTo({ ...localFilters, sector: [] });
    } else if (filter.includes('Provinces:')) {
      resetTo({ ...localFilters, province: [] });
    } else if (filter === 'Admission Open') {
      resetTo({ ...localFilters, admissionOpen: false });
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: 'fit-content' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1 }} />
          Quick Filters
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleClearFilters}
          disabled={activeFilters.length === 0}
        >
          Clear All
        </Button>
      </Box>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Active Filters:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {activeFilters.map((filter, index) => (
              <Chip
                key={index}
                label={filter}
                size="small"
                onDelete={() => handleRemoveFilter(filter)}
                deleteIcon={<ClearIcon fontSize="small" />}
              />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        {/* Row 1 */}
        <Grid item xs={12} sm={6} md={3}>
          {/* Admission Status */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="admission" style={{ marginRight: '4px' }}>🎓</span> Admission
            </Typography>
            <FormGroup sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={localFilters.admissionOpen} 
                    onChange={handleCheckboxChange} 
                    name="admissionOpen" 
                    color="success"
                  />
                }
                label="Open Only"
              />
            </FormGroup>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {/* Sector Selection */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="sector" style={{ marginRight: '4px' }}>🏢</span> Sector
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {SECTORS.map((sector) => (
                <Chip key={sector} label={sector} size="small" clickable color={localFilters.sector.includes(sector) ? 'primary' : 'default'} onClick={() => handleChipToggle('sector', sector)} />
              ))}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {/* Province Selection */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="province" style={{ marginRight: '4px' }}>🗺️</span> Province
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {PROVINCES.map((province) => (
                <Chip key={province} label={province} size="small" clickable color={localFilters.province.includes(province) ? 'primary' : 'default'} onClick={() => handleChipToggle('province', province)} />
              ))}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {/* Program Types */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="program" style={{ marginRight: '4px' }}>📚</span> Program Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {PROGRAM_TYPES.map((program) => (
                <Chip key={program} label={program} size="small" clickable color={localFilters.programType.includes(program) ? 'primary' : 'default'} onClick={() => handleChipToggle('programType', program)} />
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Row 2 */}
        <Grid item xs={12}>
          {/* Cities */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="city" style={{ marginRight: '4px' }}>🏙️</span> Major Cities
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {CITIES.map((city) => (
                <Chip key={city} label={city} size="small" clickable color={localFilters.location.includes(city) ? 'primary' : 'default'} onClick={() => handleChipToggle('location', city)} />
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FilterPanel; 