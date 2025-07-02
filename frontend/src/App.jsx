import { useState, useEffect, useRef } from 'react';
import './App.css';
import ProfileDropdown from './components/ProfileDropdown';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';

// Import the necessary Amplify functions and styles
import { Hub } from 'aws-amplify/utils';
import { signInWithRedirect, signOut, getCurrentUser } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';


function App() {
  const [user, setUser] = useState(null); // This will hold our authenticated user
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [dashboardData, setDashboardData] = useState({
    classData: [],
    allUsers: [],
    allEnrollments: []
  });

  const dropdownRef = useRef(null);

  // This effect now checks for a user session on load
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // No user is signed in
        setUser(null);
      }
    };

    checkUser();

    // Listen for auth events (like sign-in)
    const unsubscribe = Hub.listen('auth', ({ payload: { event, data } }) => {
      if (event === 'signedIn') {
        setUser(data);
      }
      if (event === 'signedOut') {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);


  // This effect fetches data after a user is logged in
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;

    const processData = (data) => {
      const enrollmentCounts = data.enrollments.reduce((acc, enrollment) => {
        acc[enrollment.userId] = (acc[enrollment.userId] || 0) + 1;
        return acc;
      }, {});
      let userToDisplay = data.users.find(u => u.role === 'teacher' && enrollmentCounts[u.userId] > 1);
      if (!userToDisplay) {
        const enrolledUserIds = new Set(data.enrollments.map(e => e.userId));
        userToDisplay = data.users.find(u => u.role === 'teacher' && enrolledUserIds.has(u.userId));
      }
      if (!userToDisplay) {
        const enrolledUserIds = new Set(data.enrollments.map(e => e.userId));
        userToDisplay = data.users.find(u => u.role === 'student' && enrolledUserIds.has(u.userId));
      }

      const userEnrollments = data.enrollments.filter(e => e.userId === userToDisplay?.userId);
      const processedClasses = userEnrollments.map((enrollment, index) => {
        const classInfo = data.classes.find(c => c.classId === enrollment.classId);
        const teacherEnrollment = data.enrollments.find(e => e.classId === enrollment.classId && e.role === 'teacher');
        const teacher = teacherEnrollment ? data.users.find(u => u.userId === teacherEnrollment.userId) : null;
        return {
          key: `${enrollment.userId}-${enrollment.classId}-${index}`,
          classId: enrollment.classId,
          className: classInfo ? classInfo.className : `Class ${enrollment.classId}`,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A'
        };
      });
      setDashboardData({ classData: processedClasses, allUsers: data.users, allEnrollments: data.enrollments });
    };

    const fetchData = async () => {
      if (!API_URL) {
        setError("API URL is not configured.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        processData(data); 
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    if(user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  const renderDashboard = () => {
    const simulatedUserRole = 'teacher'; 
    const props = { ...dashboardData, searchTerm: '' };
    if (simulatedUserRole === 'teacher') return <TeacherDashboard {...props} />;
    return <StudentDashboard {...props} />;
  };

  // If there is no user, show our custom Login component
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
            {isDropdownOpen && <ProfileDropdown user={user} onSignOut={signOut} />}
        </div>
      </header>
      <main className="dashboard-main">
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {!loading && !error && renderDashboard()}
      </main>
    </div>
  );
}

// This is our new custom Login component
function Login() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Welcome</h1>
        <p>Please sign in to continue</p>
        <button 
          className="login-button"
          onClick={() => signInWithRedirect({ provider: 'ClassLink' })}
        >
          Sign in with ClassLink
        </button>
      </div>
    </div>
  );
}

// The default export is now just the App component itself
export default App;
