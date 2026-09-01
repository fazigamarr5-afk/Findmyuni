import api from './axios-config';

// Re-export api for use by other services
export { api };
import { db } from '../firebase.js';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  addDoc,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Track whether we're in fallback mode
let usingFirestoreFallback = false;

export const isUsingFirestoreFallback = () => usingFirestoreFallback;

// Check if the backend API is reachable
export const checkApiConnectivity = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    usingFirestoreFallback = false;
    return true;
  } catch (error) {
    console.warn('Backend API unreachable, using Firestore fallback mode');
    usingFirestoreFallback = true;
    return false;
  }
};

// Get auth token for API requests
const getAuthToken = async () => {
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Create authenticated API request
const authApi = async (method, url, data = null) => {
  const token = await getAuthToken();
  const config = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  switch (method) {
    case 'GET':
      return api.get(url, config);
    case 'POST':
      return api.post(url, data, config);
    case 'PUT':
      return api.put(url, data, config);
    case 'DELETE':
      return api.delete(url, config);
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};

// ========== ADMIN SERVICE ==========

class AdminService {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await authApi('GET', '/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback: count from Firestore
      return this.getDashboardStatsFromFirebase();
    }
  }

  async getDashboardStatsFromFirebase() {
    try {
      const [universities, users, applications, scrapeJobs] = await Promise.all([
        getDocs(collection(db, 'universities')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'applications')),
        getDocs(query(collection(db, 'scrape_jobs'), where('status', '==', 'pending'))),
      ]);

      return {
        totalUniversities: universities.size,
        totalUsers: users.size,
        totalApplications: applications.size,
        pendingScrapeJobs: scrapeJobs.size,
      };
    } catch (error) {
      console.error('Error getting stats from Firebase:', error);
      return { totalUsers: 0, totalUniversities: 0, totalApplications: 0, pendingScrapeJobs: 0 };
    }
  }

  // Get all users
  async getUsers() {
    try {
      const response = await authApi('GET', '/admin/users');
      return response.data.users || [];
    } catch (error) {
      console.error('Error fetching users from API:', error);
      return this.getUsersFromFirebase();
    }
  }

  async getUsersFromFirebase() {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching users from Firebase:', error);
      return [];
    }
  }

  // Update a user
  async updateUser(userId, data) {
    try {
      await authApi('PUT', `/admin/users/${userId}`, data);
    } catch (error) {
      console.error('Error updating user via API:', error);
      // Fallback to Firestore
      await updateDoc(doc(db, 'users', userId), data);
    }
  }

  // Delete a user
  async deleteUser(userId) {
    try {
      await authApi('DELETE', `/admin/users/${userId}`);
    } catch (error) {
      console.error('Error deleting user via API:', error);
      await deleteDoc(doc(db, 'users', userId));
    }
  }

  // Set user as admin
  async setUserAsAdmin(userId, isAdmin) {
    try {
      await authApi('PUT', `/admin/users/${userId}/admin`, { isAdmin });
    } catch (error) {
      console.error('Error setting admin via API:', error);
      // Fallback: manage admins collection
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (isAdmin) {
          // Add to admins collection
          await addDoc(collection(db, 'admins'), {
            email: userData.email.toLowerCase(),
            name: userData.displayName || userData.name || 'Admin',
            createdAt: new Date().toISOString(),
            permissions: ['users.read', 'users.write', 'universities.read', 'universities.write'],
          });
          await updateDoc(doc(db, 'users', userId), { role: 'admin' });
        } else {
          // Remove from admins collection
          const adminQuery = query(collection(db, 'admins'), where('email', '==', userData.email.toLowerCase()));
          const adminSnapshot = await getDocs(adminQuery);
          for (const adminDoc of adminSnapshot.docs) {
            await deleteDoc(doc(db, 'admins', adminDoc.id));
          }
          await updateDoc(doc(db, 'users', userId), { role: 'user' });
        }
      }
    }
  }

  // Trigger a scrape job for a university
  async triggerScrapeJob(universityId) {
    try {
      await authApi('POST', '/scrape/scrape-university', { universityId });
    } catch (error) {
      console.error('Error triggering scrape job:', error);
      // Create a scrape request in Firestore as fallback
      await addDoc(collection(db, 'scrape_requests'), {
        universityId,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        requestedBy: getAuth().currentUser?.uid || 'unknown',
      });
    }
  }

  // Trigger batch scrape for all universities
  async triggerBatchScrapeJob() {
    try {
      await authApi('POST', '/admin/scrape-jobs/batch');
    } catch (error) {
      console.error('Error triggering batch scrape:', error);
      throw error;
    }
  }

  // Update an application
  async updateApplication(applicationId, status) {
    try {
      await authApi('PUT', `/admin/applications/${applicationId}`, { status });
    } catch (error) {
      console.error('Error updating application via API:', error);
      await updateDoc(doc(db, 'applications', applicationId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

export const adminService = new AdminService();

// ========== UNIVERSITY SERVICE (API-based) ==========

class UniversityApiService {
  async getUniversities(params = {}) {
    try {
      const response = await authApi('GET', '/universities/');
      return response.data.universities || [];
    } catch (error) {
      console.error('Error fetching universities:', error);
      return this.getUniversitiesFromFirebase();
    }
  }

  async getUniversitiesFromFirebase() {
    try {
      const snapshot = await getDocs(collection(db, 'universities'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching universities from Firebase:', error);
      return [];
    }
  }

  async getUniversity(id) {
    try {
      const response = await authApi('GET', `/universities/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching university:', error);
      const docSnap = await getDoc(doc(db, 'universities', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      throw new Error('University not found');
    }
  }

  async searchUniversities(queryStr, filters = {}) {
    try {
      const response = await authApi('POST', '/universities/search', { query: queryStr, filters });
      return response.data;
    } catch (error) {
      console.error('Error searching universities:', error);
      const all = await this.getUniversitiesFromFirebase();
      return all.filter(uni =>
        uni.name?.toLowerCase().includes(queryStr.toLowerCase()) ||
        uni.description?.toLowerCase().includes(queryStr.toLowerCase())
      );
    }
  }

  async getPrograms() {
    try {
      const response = await authApi('GET', '/universities/programs');
      return response.data;
    } catch (error) {
      return [];
    }
  }

  async getLocations() {
    try {
      const response = await authApi('GET', '/universities/locations');
      return response.data;
    } catch (error) {
      return [];
    }
  }

  async createUniversity(data) {
    const response = await authApi('POST', '/universities/', data);
    return response.data;
  }

  async updateUniversity(id, data) {
    const response = await authApi('PUT', `/universities/${id}`, data);
    return response.data;
  }

  async deleteUniversity(id) {
    const response = await authApi('DELETE', `/universities/${id}`);
    return response.data;
  }
}

export const universityService = new UniversityApiService();

// ========== APPLICATION SERVICE ==========

class ApplicationService {
  async getApplications() {
    try {
      const response = await authApi('GET', '/application/');
      return response.data.applications || [];
    } catch (error) {
      console.error('Error fetching applications:', error);
      return this.getApplicationsFromFirebase();
    }
  }

  async getApplicationsFromFirebase() {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) return [];
      const q = query(collection(db, 'applications'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching applications from Firebase:', error);
      return [];
    }
  }

  async submitApplication(data) {
    try {
      const response = await authApi('POST', '/application/', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting application:', error);
      const docRef = await addDoc(collection(db, 'applications'), {
        ...data,
        userId: getAuth().currentUser?.uid,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });
      return { id: docRef.id };
    }
  }

  async updateApplication(id, data) {
    try {
      const response = await authApi('PUT', `/application/${id}`, data);
      return response.data;
    } catch (error) {
      await updateDoc(doc(db, 'applications', id), data);
    }
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

// ========== USER SERVICE ==========

class UserService {
  async getUsers() {
    try {
      const response = await authApi('GET', '/admin/users');
      return response.data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return this.getUsersFromFirebase();
    }
  }

  async getUsersFromFirebase() {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching users from Firebase:', error);
      return [];
    }
  }

  async getUser(userId) {
    try {
      const response = await authApi('GET', `/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      throw new Error('User not found');
    }
  }

  async updateUser(userId, data) {
    try {
      await authApi('PUT', `/admin/users/${userId}`, data);
    } catch (error) {
      await updateDoc(doc(db, 'users', userId), data);
    }
  }

  async deleteUser(userId) {
    try {
      await authApi('DELETE', `/admin/users/${userId}`);
    } catch (error) {
      await deleteDoc(doc(db, 'users', userId));
    }
  }
}

export const userService = new UserService();
