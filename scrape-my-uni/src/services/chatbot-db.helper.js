/**
 * Chatbot Database Helper
 * Allows the chatbot to query real university data from Supabase
 * for accurate, personalized recommendations.
 */
import { supabase } from '../supabase';

/**
 * Search universities by program name
 * @param {string} program - Program to search for (e.g., "Computer Science")
 * @param {object} filters - Optional filters { sector, province, level }
 * @returns {Promise<Array>} - Matching universities with program info
 */
export async function searchByProgram(program, filters = {}) {
  let query = supabase.from('universities').select('id, name, basic_info, programs, scholarships, facilities');
  
  const { data, error } = await query.order('name');
  if (error || !data) return [];
  
  const programLower = program.toLowerCase();
  
  return data.filter(uni => {
    const programs = uni.programs || {};
    let hasProgram = false;
    
    // Check all program categories
    const allPrograms = [
      ...(programs.BSPrograms || []),
      ...(programs.MSPrograms || []),
      ...(programs.PhDPrograms || []),
      ...(programs.u || []),
      ...(programs.g || []),
      ...(programs.d || [])
    ];
    
    hasProgram = allPrograms.some(p => {
      const pName = typeof p === 'string' ? p : p.name || '';
      return pName.toLowerCase().includes(programLower);
    });
    
    if (!hasProgram) return false;
    
    // Apply filters
    const bi = uni.basic_info || {};
    if (filters.sector && bi.Sector?.toLowerCase() !== filters.sector.toLowerCase()) return false;
    if (filters.province && !bi.Location?.toLowerCase().includes(filters.province.toLowerCase())) return false;
    
    return true;
  }).slice(0, 10);
}

/**
 * Get top ranked universities
 * @param {number} limit - Number of results
 * @param {string} field - Optional field filter (e.g., "CS", "Engineering")
 * @returns {Promise<Array>} - Top ranked universities
 */
export async function getTopRanked(limit = 10, field = null) {
  const { data, error } = await supabase
    .from('universities')
    .select('id, name, basic_info, programs, scholarships')
    .order('name');
  
  if (error || !data) return [];
  
  let ranked = data
    .filter(uni => uni.basic_info?.rankings?.national)
    .sort((a, b) => (a.basic_info.rankings.national || 999) - (b.basic_info.rankings.national || 999));
  
  if (field) {
    const fieldLower = field.toLowerCase();
    ranked = ranked.filter(uni => {
      const rk = uni.basic_info?.rankings?.prog || {};
      return Object.keys(rk).some(k => k.toLowerCase().includes(fieldLower));
    });
  }
  
  return ranked.slice(0, limit);
}

/**
 * Search universities by name
 * @param {string} name - University name to search
 * @returns {Promise<Array>} - Matching universities
 */
export async function searchByName(name) {
  const { data, error } = await supabase
    .from('universities')
    .select('id, name, basic_info, programs, scholarships, facilities, url, apply_link')
    .ilike('name', `%${name}%`)
    .limit(5);
  
  return error ? [] : (data || []);
}

/**
 * Get universities with open admissions
 * @returns {Promise<Array>} - Universities with upcoming deadlines
 */
export async function getOpenAdmissions() {
  const { data, error } = await supabase
    .from('universities')
    .select('id, name, basic_info, programs')
    .order('name');
  
  if (error || !data) return [];
  
  const today = new Date();
  return data.filter(uni => {
    const deadline = uni.basic_info?.['Deadline to Apply'];
    if (!deadline) return false;
    try {
      return new Date(deadline) >= today;
    } catch {
      return false;
    }
  }).slice(0, 10);
}

/**
 * Get scholarship information for a university
 * @param {string} universityName - University name
 * @returns {Promise<Object|null>} - Scholarship data
 */
export async function getScholarships(universityName) {
  const unis = await searchByName(universityName);
  if (unis.length === 0) return null;
  
  const uni = unis[0];
  return {
    name: uni.name,
    scholarships: uni.scholarships || []
  };
}

/**
 * Compare two universities
 * @param {string} name1 - First university name
 * @param {string} name2 - Second university name
 * @returns {Promise<Array>} - Both universities' data
 */
export async function compareUniversities(name1, name2) {
  const uni1 = await searchByName(name1);
  const uni2 = await searchByName(name2);
  
  return [
    uni1.length > 0 ? uni1[0] : null,
    uni2.length > 0 ? uni2[0] : null
  ].filter(Boolean);
}

/**
 * Get university details by ID
 * @param {string} id - University ID
 * @returns {Promise<Object|null>} - University data
 */
export async function getUniversityById(id) {
  const { data, error } = await supabase
    .from('universities')
    .select('id, name, basic_info, programs, scholarships, facilities, url, apply_link, description')
    .eq('id', id)
    .single();
  
  return error ? null : data;
}

/**
 * Get deadline countdown for a university
 * @param {string} universityName - University name
 * @returns {Promise<Object|null>} - Deadline info
 */
export async function getDeadlineInfo(universityName) {
  const unis = await searchByName(universityName);
  if (unis.length === 0) return null;
  
  const uni = unis[0];
  const deadline = uni.basic_info?.['Deadline to Apply'];
  if (!deadline) return { name: uni.name, deadline: null, message: 'No deadline listed' };
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  
  return {
    name: uni.name,
    deadline,
    daysLeft,
    isPast: daysLeft < 0,
    message: daysLeft < 0 
      ? `Deadline has passed (${deadline})`
      : daysLeft === 0 
        ? 'Deadline is TODAY!'
        : `${daysLeft} days left (deadline: ${deadline})`
  };
}

/**
 * Build context string for the chatbot to include in its knowledge
 * This gives the AI real data to work with
 */
export async function buildChatContext(userMessage) {
  const msg = userMessage.toLowerCase();
  const contextParts = [];
  
  // Detect what the user is asking about and fetch relevant data
  if (msg.includes('program') || msg.includes('course') || msg.includes('degree') || msg.includes('study')) {
    // Extract potential program name
    const programs = ['computer science', 'engineering', 'business', 'medicine', 'pharmacy', 
                      'law', 'education', 'arts', 'science', 'mathematics', 'physics',
                      'data science', 'artificial intelligence', 'software engineering',
                      'electrical engineering', 'civil engineering', 'mechanical engineering'];
    
    for (const prog of programs) {
      if (msg.includes(prog)) {
        const results = await searchByProgram(prog);
        if (results.length > 0) {
          contextParts.push(`Universities offering ${prog}: ${results.map(u => {
            const rk = u.basic_info?.rankings;
            const rankStr = rk?.national ? ` (Rank #${rk.national} in Pakistan)` : '';
            return `${u.name}${rankStr}`;
          }).join(', ')}`);
        }
        break;
      }
    }
  }
  
  if (msg.includes('rank') || msg.includes('best') || msg.includes('top')) {
    const field = null;
    const programs = ['cs', 'engineering', 'business', 'medical', 'computer science'];
    for (const p of programs) {
      if (msg.includes(p)) {
        const results = await getTopRanked(5, p);
        if (results.length > 0) {
          contextParts.push(`Top ${p} universities: ${results.map(u => 
            `#${u.basic_info.rankings.national} ${u.name}`
          ).join(', ')}`);
        }
        break;
      }
    }
    
    if (contextParts.length === 0) {
      const results = await getTopRanked(10);
      if (results.length > 0) {
        contextParts.push(`Top 10 universities in Pakistan: ${results.map(u => 
          `#${u.basic_info.rankings.national} ${u.name}`
        ).join(', ')}`);
      }
    }
  }
  
  if (msg.includes('deadline') || msg.includes('admission') || msg.includes('apply')) {
    // Check for specific university name
    const uniNames = ['nust', 'lums', 'comsats', 'fast', 'iba', 'uet', 'qau', 'pu', 'punjab'];
    let found = false;
    for (const name of uniNames) {
      if (msg.includes(name)) {
        const deadline = await getDeadlineInfo(name);
        if (deadline) {
          contextParts.push(`${deadline.name}: ${deadline.message}`);
          found = true;
        }
        break;
      }
    }
    if (!found) {
      const open = await getOpenAdmissions();
      if (open.length > 0) {
        contextParts.push(`Universities with open admissions: ${open.map(u => {
          const d = u.basic_info?.['Deadline to Apply'];
          return `${u.name} (deadline: ${d})`;
        }).join(', ')}`);
      }
    }
  }
  
  if (msg.includes('scholarship') || msg.includes('financial aid') || msg.includes('fee')) {
    const uniNames = ['nust', 'lums', 'comsats', 'fast', 'iba'];
    for (const name of uniNames) {
      if (msg.includes(name)) {
        const sch = await getScholarships(name);
        if (sch) {
          const schList = Array.isArray(sch.scholarships) 
            ? sch.scholarships.slice(0, 5).join(', ')
            : typeof sch.scholarships === 'object'
              ? Object.values(sch.scholarships).flat().slice(0, 5).join(', ')
              : 'Check university website';
          contextParts.push(`${sch.name} scholarships: ${schList}`);
        }
        break;
      }
    }
  }
  
  // Total stats
  const { count } = await supabase.from('universities').select('id', { count: 'exact', head: true });
  contextParts.push(`Database: ${count || 336} Pakistani universities with complete data (programs, rankings, scholarships, deadlines)`);
  
  return contextParts.join('\n');
}
