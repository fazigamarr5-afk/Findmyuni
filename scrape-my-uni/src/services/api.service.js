import api from './axios-config';
import { supabase } from '../supabase';

// Track whether we're in fallback mode
let usingSupabaseFallback = false;

export const isUsingFirestoreFallback = () => usingSupabaseFallback;

// Check if the backend API is reachable
export const checkApiConnectivity = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    usingSupabaseFallback = false;
    return true;
  } catch (error) {
    console.warn('Backend API unreachable, using Supabase direct mode');
    usingSupabaseFallback = true;
    return false;
  }
};

// Re-export api for use by other services
export { api };

// ========== ADMIN SERVICE ==========

class AdminService {
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return this.getDashboardStatsFromSupabase();
    }
  }

  async getDashboardStatsFromSupabase() {
    try {
      const [universities, users, applications, scrapeJobs] = await Promise.all([
        supabase.from('universities').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('scrape_jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return {
        totalUniversities: universities.count || 0,
        totalUsers: users.count || 0,
        totalApplications: applications.count || 0,
        pendingScrapeJobs: scrapeJobs.count || 0,
      };
    } catch (error) {
      console.error('Error getting stats from Supabase:', error);
      return { totalUsers: 0, totalUniversities: 0, totalApplications: 0, pendingScrapeJobs: 0 };
    }
  }

  async getUsers() {
    try {
      const response = await api.get('/admin/users');
      return response.data.users || [];
    } catch (error) {
      return this.getUsersFromSupabase();
    }
  }

  async getUsersFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users from Supabase:', error);
      return [];
    }
  }

  async updateUser(userId, data) {
    try {
      await api.put(`/admin/users/${userId}`, data);
    } catch (error) {
      await supabase.from('users').update(data).eq('id', userId);
    }
  }

  async deleteUser(userId) {
    try {
      await api.delete(`/admin/users/${userId}`);
    } catch (error) {
      await supabase.from('users').delete().eq('id', userId);
    }
  }

  async setUserAsAdmin(userId, isAdmin) {
    try {
      await api.put(`/admin/users/${userId}/admin`, { isAdmin });
    } catch (error) {
      if (isAdmin) {
        const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();
        if (userData) {
          await supabase.from('admins').upsert({
            user_id: userId,
            email: userData.email.toLowerCase(),
            name: userData.display_name || 'Admin',
          });
          await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
        }
      } else {
        await supabase.from('admins').delete().eq('user_id', userId);
        await supabase.from('users').update({ role: 'user' }).eq('id', userId);
      }
    }
  }

  async triggerScrapeJob(universityId) {
    try {
      await api.post('/scrape/scrape-university', { universityId });
    } catch (error) {
      await supabase.from('scrape_requests').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        university_url: universityId,
        status: 'pending',
      });
    }
  }

  async triggerBatchScrapeJob() {
    try {
      await api.post('/admin/scrape-jobs/batch');
    } catch (error) {
      console.error('Error triggering batch scrape:', error);
      throw error;
    }
  }

  async updateApplication(applicationId, status) {
    try {
      await api.put(`/admin/applications/${applicationId}`, { status });
    } catch (error) {
      await supabase.from('applications').update({ status }).eq('id', applicationId);
    }
  }
}

export const adminService = new AdminService();

// ========== UNIVERSITY SERVICE ==========

class UniversityApiService {
  async getAll() {
    return this.getUniversities();
  }

  async getUniversitiesByDeadlineSoon(days = 60, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []).slice(0, limit);
    } catch (error) {
      console.error('Error fetching universities by deadline:', error);
      return [];
    }
  }

  async getUniversities(params = {}) {
    try {
      const response = await api.get('/universities/');
      return response.data.universities || [];
    } catch (error) {
      return this.getUniversitiesFromSupabase();
    }
  }

  async getUniversitiesFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching universities from Supabase:', error);
      return [];
    }
  }

  async getUniversity(id) {
    try {
      const response = await api.get(`/universities/${id}`);
      return response.data;
    } catch (error) {
      const { data, error: dbError } = await supabase
        .from('universities')
        .select('*')
        .eq('id', id)
        .single();
      if (dbError) throw new Error('University not found');
      return data;
    }
  }

  async searchUniversities(queryStr, filters = {}) {
    try {
      const response = await api.post('/universities/search', { query: queryStr, filters });
      return response.data;
    } catch (error) {
      const { data } = await supabase
        .from('universities')
        .select('*')
        .ilike('name', `%${queryStr}%`);
      return data || [];
    }
  }

  async compare(ids = []) {
    if (ids.length < 2) throw new Error('At least 2 universities required');
    const promises = ids.map(id => this.getUniversity(id));
    const universities = await Promise.all(promises);
    return { universities };
  }

  async getPrograms() {
    try {
      const response = await api.get('/universities/programs');
      return response.data;
    } catch (error) {
      const { data } = await supabase.from('universities').select('programs');
      const allPrograms = new Set();
      (data || []).forEach(uni => {
        if (uni.programs && typeof uni.programs === 'object') {
          Object.values(uni.programs).forEach(progs => {
            if (Array.isArray(progs)) {
              progs.forEach(p => allPrograms.add(p));
            }
          });
        }
      });
      return [...allPrograms].sort();
    }
  }

  async getLocations() {
    try {
      const response = await api.get('/universities/locations');
      return response.data;
    } catch (error) {
      const { data } = await supabase.from('universities').select('basic_info');
      const locations = new Set();
      (data || []).forEach(uni => {
        const loc = uni.basic_info?.Location;
        if (loc) locations.add(loc);
      });
      return [...locations].sort();
    }
  }

  async createUniversity(data) {
    const response = await api.post('/universities/', data);
    return response.data;
  }

  async updateUniversity(id, data) {
    const { error } = await supabase.from('universities').update(data).eq('id', id);
    if (error) throw error;
  }

  async deleteUniversity(id) {
    const { error } = await supabase.from('universities').delete().eq('id', id);
    if (error) throw error;
  }
}

export const universityService = new UniversityApiService();

// ========== USER SERVICE ==========

class UserService {
  async getUsers() {
    try {
      const response = await api.get('/admin/users');
      return response.data.users || [];
    } catch (error) {
      return this.getUsersFromSupabase();
    }
  }

  async getUsersFromSupabase() {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUser(userId) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) throw new Error('User not found');
      return data;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId, data) {
    const { error } = await supabase.from('users').update(data).eq('id', userId);
    if (error) throw error;
  }

  async deleteUser(userId) {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
  }
}

export const userService = new UserService();

// ========== APPLICATION SERVICE ==========

class ApplicationService {
  async getApplications() {
    try {
      const response = await api.get('/application/');
      return response.data.applications || [];
    } catch (error) {
      return this.getApplicationsFromSupabase();
    }
  }

  async getApplicationsFromSupabase() {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return [];
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
  }

  async submitApplication(data) {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from('applications').insert({
        ...data,
        user_id: user?.id,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }

  async updateApplication(id, data) {
    const { error } = await supabase.from('applications').update(data).eq('id', id);
    if (error) throw error;
  }
}

export const applicationService = new ApplicationService();

// ========== CONNECTION STATUS ==========

class ConnectionStatus {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notify();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notify();
    });
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.isOnline));
  }

  getStatus() {
    return this.isOnline;
  }
}

export const connectionStatus = new ConnectionStatus();
