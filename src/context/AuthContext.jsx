import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clearAll } from '@/utils/storageUtils';
import { apiRequest, clearAuthToken, getAuthToken, jsonBody, setAuthToken } from '@/services/apiClient';
import { clearAccountCache, hydrateDataCache } from '@/services/dataCache';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState('');

  const loadAccount = useCallback(async () => {
    const data = await apiRequest('/bootstrap');
    hydrateDataCache(data);
    setUser(data.user);
    setInitializationError('');
    return data.user;
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest('/auth/me')
      .then(loadAccount)
      .catch((error) => {
        if (error.message.includes('session has expired') || error.message.includes('Account no longer exists')) {
          clearAuthToken();
          clearAccountCache();
        } else {
          setInitializationError(error.message);
        }
      })
      .finally(() => setLoading(false));
  }, [loadAccount]);

  const authenticate = useCallback(async (path, credentials) => {
    setInitializationError('');
    const result = await apiRequest(path, { method: 'POST', body: jsonBody(credentials) });
    setAuthToken(result.token);
    try {
      const account = await loadAccount();
      return { user: account };
    } catch (error) {
      clearAuthToken();
      clearAccountCache();
      throw error;
    }
  }, [loadAccount]);

  const signup = useCallback((details) => authenticate('/auth/signup', details), [authenticate]);
  const login = useCallback((credentials) => authenticate('/auth/login', credentials), [authenticate]);

  const logout = useCallback(() => {
    clearAuthToken();
    clearAccountCache();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const result = await apiRequest('/auth/me', {
      method: 'PATCH',
      body: jsonBody(updates),
    });
    const updated = result.user;
    setUser(updated);
    return updated;
  }, []);

  const deleteProfile = useCallback(async () => {
    await apiRequest('/auth/me', { method: 'DELETE' });
    clearAuthToken();
    clearAccountCache();
    clearAll();
    setUser(null);
  }, []);

  const retryInitialization = useCallback(async () => {
    setLoading(true);
    setInitializationError('');
    try {
      await apiRequest('/auth/me');
      await loadAccount();
    } catch (error) {
      setInitializationError(error.message);
    } finally {
      setLoading(false);
    }
  }, [loadAccount]);

  const value = {
    user,
    loading,
    initializationError,
    retryInitialization,
    signup,
    login,
    logout,
    updateProfile,
    deleteProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
