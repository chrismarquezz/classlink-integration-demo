import { useState, useEffect, useRef } from 'react';
import './App.css';
import ProfileDropdown from './components/ProfileDropdown';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);
  const hasHandledCode = useRef(false);

  useEffect(() => {
    const exchangeCodeForData = async (code) => {
      if (hasHandledCode.current) return;
      hasHandledCode.current = true;

      console.log("Successfully redirected back from ClassLink with code:", code);

      try {
        setLoading(true);
        setError(null);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const response = await fetch(import.meta.env.VITE_API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        console.log('Lambda response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log('User data received from Lambda:', userData);

        setUser(userData);
        setLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);

      } catch (err) {
        console.error('Error calling Lambda:', err);
        setError(`Authentication failed: ${err.message}`);
        setLoading(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      exchangeCodeForData(code);
    } else {
      setLoading(false);
    }
  }, []);

  const handleSignOut = () => setUser(null);

  const renderDashboard = () => {
    if (!user) return null;
    const userRole = user.userProfile?.role;
    if (userRole === 'teacher') return <TeacherDashboard teacherData={user} />;
    return <StudentDashboard studentData={user} />;
  };

  if (loading) {
    return (
      <div className="login-container">
        <p style={{ color: 'black' }}>Authenticating...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2 className="error-message">Authentication Error</h2>
          <p style={{ color: 'black' }}>{error}</p>
          <p>Please try signing in again.</p>
          <button className="login-button" onClick={() => window.location.href = '/'}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h3>My Classes</h3>
          <span className="separator">|</span>
          <h4>Dashboard</h4>
        </div>
        <div className="header-right" ref={dropdownRef}>
          <div className="profile-pic" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          {isDropdownOpen && (
            <ProfileDropdown user={user.userProfile} onSignOut={handleSignOut} />
          )}
        </div>
      </header>
      <main className="dashboard-main">
        {renderDashboard()}
      </main>
    </div>
  );
}

export default App;
