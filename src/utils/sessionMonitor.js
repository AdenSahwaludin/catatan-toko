import { useAuthStore } from '@/stores/auth';

export const setupSessionMonitor = () => {
  const authStore = useAuthStore();
  
  // Check session validity every hour
  const checkSession = () => {
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (lastLoginTime) {
      const timeDiff = Date.now() - parseInt(lastLoginTime);
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
      
      // If more than 1 week, auto logout
      if (timeDiff >= oneWeek) {
        authStore.signOut();
        console.log('Session expired after 1 week');
        // You could show a notification here
      }
      
      // Show warning if 6 days passed (1 day before expiry)
      const sixDays = 6 * 24 * 60 * 60 * 1000;
      if (timeDiff >= sixDays && timeDiff < oneWeek) {
        console.log('Session will expire in 1 day');
        // You could show a notification here
      }
    }
  };
  
  // Check immediately
  checkSession();
  
  // Set up periodic check (every hour)
  const interval = setInterval(checkSession, 60 * 60 * 1000);
  
  return () => {
    clearInterval(interval);
  };
};

export const getSessionTimeRemaining = () => {
  const lastLoginTime = localStorage.getItem('lastLoginTime');
  if (!lastLoginTime) return null;
  
  const timeDiff = Date.now() - parseInt(lastLoginTime);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const remaining = oneWeek - timeDiff;
  
  if (remaining <= 0) return null;
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  return { days, hours, milliseconds: remaining };
};
