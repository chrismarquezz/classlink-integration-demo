import { useState, useEffect, useRef } from 'react';
import './App.css';
import ProfileDropdown from './components/ProfileDropdown';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null); // This will hold our user profile from our DB
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const dropdownRef = useRef(null);

  // This effect runs only once on component mount to handle the login redirect
  useEffect(() => {
    const API_URL = import.meta.env.VITE_SECURE_API_URL;

    const exchangeCodeForData = async (code) => {
      // We are in the process of authenticating, so set loading to true
      setLoading(true); 
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUser(data); // Set the user, which will trigger a re-render to the dashboard
      } catch (e) {
        setError(e.message);
      } finally {
        // Clean the code from the URL so it's not used again on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoading(false);
      }
    };

    // Check the URL for a 'code' query parameter when the app loads
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // If a code is found, exchange it for user data
      exchangeCodeForData(code);
    } else {
      // If no code, we are not logged in and not loading
      setLoading(false);
    }
  }, []); // Empty array means this runs only once

  const handleSignOut = () => {
    // For now, signing out just clears the user state.
    // In a real app, you would also call a Cognito sign-out URL.
    setUser(null);
  };

  const renderDashboard = () => {
    if (!user) return null;
    const userRole = user.userProfile?.role;
    if (userRole === 'teacher') return <TeacherDashboard teacherData={user} />;
    return <StudentDashboard studentData={user} />;
  };

  // Show a loading/authenticating screen while we check for the code
  if (loading) {
    return (
      <div className="login-container">
        <p style={{color: 'black'}}>Authenticating...</p>
      </div>
    );
  }

  // If there is an error, display it on a dedicated error page
  if (error) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2 className="error-message">Authentication Error</h2>
          <p style={{color: 'black'}}>{error}</p>
          <p>Please try signing in again.</p>
          <button className="login-button" onClick={() => window.location.href = '/'}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // If there is no user, show the Login component
  if (!user) {
    return <Login />;
  }

  // If there is a user, show the main application
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
            <div className="logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3>My Classes</h3>
            <span className="separator">|</span>
            <h4>Dashboard</h4>
        </div>
        <div className="header-right" ref={dropdownRef}>
            <div className="profile-pic" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            {isDropdownOpen && <ProfileDropdown user={user.userProfile} onSignOut={handleSignOut} />}
        </div>
      </header>
      <main className="dashboard-main">
        {renderDashboard()}
      </main>
    </div>
  );
}

export default App;
