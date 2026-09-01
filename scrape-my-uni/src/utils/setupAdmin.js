import { supabase } from '../supabase';

/**
 * Adds a new admin user to Firestore
 * 
 * @param {string} email - The email of the admin user
 * @param {string} name - The name of the admin user
 * @returns {Promise<string>} - The ID of the created admin document
 */
export const addAdmin = async (email, name = 'Admin User') => {
  try {
    const { data, error } = await supabase.from('admins').insert({
      email: email.toLowerCase(),
      name,
    }).select().single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding admin:', error);
    throw error;
  }
};

/**
 * Checks if a user is an admin
 * 
 * @param {string} email - The email to check
 * @returns {Promise<boolean>} - Whether the user is an admin
 */
export const isAdmin = async (email) => {
  if (!email) return false;
  
  try {
    const { data } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Use this for development purposes only
// This can be called from the browser console to add an admin
window.addAdminUser = async (email, name) => {
  const id = await addAdmin(email, name);
  console.log(`Added admin with ID: ${id}`);
  return id;
};

// Example usage in browser console:
// window.addAdminUser('admin@scrapemyuni.com', 'Admin User'); 