import { useState, useCallback } from 'react';
import { EMPTY_FILTERS } from '../constants/filters';

/**
 * Shared filter state management used by FilterPanel and MobileFilterModal.
 * Eliminates duplicated chip-toggle / checkbox / clear logic.
 */
export default function useFilters(initialFilters = EMPTY_FILTERS) {
  const [localFilters, setLocalFilters] = useState({
    programType: initialFilters.programType || [],
    location: initialFilters.location || [],
    sector: initialFilters.sector || [],
    province: initialFilters.province || [],
    admissionOpen: initialFilters.admissionOpen || false,
  });

  const handleChipToggle = useCallback((filterType, value) => {
    setLocalFilters((prev) => {
      const current = prev[filterType] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [filterType]: next };
    });
  }, []);

  const handleCheckboxChange = useCallback((event) => {
    setLocalFilters((prev) => ({
      ...prev,
      [event.target.name]: event.target.checked,
    }));
  }, []);

  const clearAll = useCallback(() => {
    setLocalFilters({ ...EMPTY_FILTERS });
  }, []);

  const resetTo = useCallback((filters) => {
    setLocalFilters({
      programType: filters.programType || [],
      location: filters.location || [],
      sector: filters.sector || [],
      province: filters.province || [],
      admissionOpen: filters.admissionOpen || false,
    });
  }, []);

  return {
    localFilters,
    setLocalFilters,
    handleChipToggle,
    handleCheckboxChange,
    clearAll,
    resetTo,
  };
}
