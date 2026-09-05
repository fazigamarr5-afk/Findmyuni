// Shared filter option constants — single source of truth
export const SECTORS = ['Public', 'Private', 'Semi Government'];

export const PROVINCES = [
  'Punjab', 'Sindh', 'KPK', 'Balochistan',
  'Islamabad', 'AJK', 'Gilgit',
];

export const PROGRAM_TYPES = ['BS', 'MS', 'PhD', 'Associate', 'Diploma', 'Certificate'];

export const CITIES = [
  'Islamabad', 'Lahore', 'Karachi', 'Peshawar', 'Quetta', 'Multan',
  'Faisalabad', 'Rawalpindi', 'Sialkot', 'Bahawalpur', 'Hyderabad', 'Jamshoro',
];

export const EMPTY_FILTERS = {
  programType: [],
  location: [],
  sector: [],
  province: [],
  admissionOpen: false,
};
