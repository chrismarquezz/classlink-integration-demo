import { useState, useEffect, useRef } from 'react';
import './App.css';
import ProfileDropdown from './components/ProfileDropdown';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import Login from './components/Login';

// Import the necessary Amplify functions
import { Hub } from 'aws-amplify/utils';
import { signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import DashboardLayout from './components/DashboardLayout';

function App() {
  const API_URL = import.meta.env.VITE_SECURE_API_URL;

  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Start in a loading state
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const dropdownRef = useRef(null);

  // Handle authentication lifecycle
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const unsubscribe = Hub.listen('auth', ({ payload: { event, data } }) => {
      if (event === 'signedIn') setUser(data);
      if (event === 'signedOut') {
        setUser(null);
        setDashboardData(null);
      }
    });

    return unsubscribe;
  }, []);

  // Fetch dashboard data when user changes
  useEffect(() => {
    const fetchData = async () => {
      if (!API_URL || !user) return;

      setLoading(true);
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) throw new Error("User is not authenticated.");

        const response = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (e) {
        setError(e.message);
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, API_URL]);

  const renderDashboard = () => {
    if (!dashboardData) return <p>Loading dashboard data...</p>;
    const userRole = dashboardData.userProfile?.role;
    if (userRole === 'teacher') return <TeacherDashboard teacherData={dashboardData} />;
    return <StudentDashboard studentData={dashboardData} />;
  };

  if (loading) {
    return (
      <div className="login-container">
        <p style={{ color: 'black' }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <DashboardLayout
      dropdownRef={dropdownRef}
      isDropdownOpen={isDropdownOpen}
      user={user}
      onSignOut={signOut}
      onProfileClick={() => setIsDropdownOpen(!isDropdownOpen)}
    >
      {error ? <p className="error-message">Error: {error}</p> : renderDashboard()}
    </DashboardLayout>
  );
}

export default App;
