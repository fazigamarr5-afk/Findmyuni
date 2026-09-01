import { supabase } from '../supabase';

/**
 * Helper function to add an admin user from the console
 * Usage in browser console: window.addAdmin('admin@example.com', 'Admin Name')
 */
export const setupConsoleHelpers = () => {
  window.addAdmin = async (email, name = 'Admin User') => {
    if (!email) {
      console.error('Email is required');
      return null;
    }
    
    try {
      // Check if admin already exists
      const { data: existing } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (existing) {
        console.warn('Admin with this email already exists:', email);
        return { 
          success: false, 
          message: 'Admin already exists',
          id: existing.id
        };
      }
      
      const { data, error } = await supabase.from('admins').insert({
        email: email.toLowerCase(),
        name,
      }).select().single();
      
      if (error) throw error;
      console.log('Admin added successfully with ID:', data.id);
      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error adding admin:', error);
      return { success: false, error };
    }
  };
  
  window.listAdmins = async () => {
    try {
      const { data, error } = await supabase.from('admins').select('*');
      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log('No admins found');
        return [];
      }
      
      console.table(data);
      return data;
    } catch (error) {
      console.error('Error listing admins:', error);
      return [];
    }
  };
  
  console.log('Admin console helpers loaded. Use window.addAdmin() or window.listAdmins()');
};

// For convenience, automatically setup the helpers
setupConsoleHelpers(); 