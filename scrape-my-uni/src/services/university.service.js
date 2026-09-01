import { supabase } from '../supabase';

class UniversityService {
  async getUniversities(filters = {}) {
    try {
      let query = supabase.from('universities').select('*');
      
      if (filters.province) {
        query = query.eq('basic_info->>Location', filters.province);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting universities:', error);
      throw error;
    }
  }

  async getUniversity(id) {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw new Error('University not found');
      return data;
    } catch (error) {
      console.error('Error getting university:', error);
      throw error;
    }
  }

  async getById(id) {
    return this.getUniversity(id);
  }

  async getAll() {
    try {
      const { data, error } = await supabase.from('universities').select('*').order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all universities:', error);
      throw error;
    }
  }

  async search(searchTerm, filters = {}) {
    try {
      const { data } = await supabase
        .from('universities')
        .select('*')
        .ilike('name', `%${searchTerm}%`);
      return data || [];
    } catch (error) {
      console.error('Error searching universities:', error);
      throw error;
    }
  }

  async getUniversityPrograms(universityId) {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('programs')
        .eq('id', universityId)
        .single();
      if (error) throw error;
      return data?.programs || {};
    } catch (error) {
      console.error('Error getting university programs:', error);
      throw error;
    }
  }

  async addUniversity(data) {
    try {
      const { data: result, error } = await supabase
        .from('universities')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result.id;
    } catch (error) {
      console.error('Error adding university:', error);
      throw error;
    }
  }

  async updateUniversity(id, data) {
    try {
      const { error } = await supabase
        .from('universities')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating university:', error);
      throw error;
    }
  }

  async deleteUniversity(id) {
    try {
      const { error } = await supabase.from('universities').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting university:', error);
      throw error;
    }
  }

  async getTopUniversities(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name')
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting top universities:', error);
      throw error;
    }
  }
}

export const universityService = new UniversityService();
