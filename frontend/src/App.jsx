import { useState, useEffect, useRef } from 'react';
import './App.css';
import ProfileDropdown from './components/ProfileDropdown';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dashboardData, setDashboardData] = useState({
    classData: [],
    allUsers: [],
    allEnrollments: []
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;

    const processData = (data) => {
      const enrollmentCounts = data.enrollments.reduce((acc, enrollment) => {
        acc[enrollment.userId] = (acc[enrollment.userId] || 0) + 1;
        return acc;
      }, {});
      
      let user = data.users.find(u => u.role === 'teacher' && enrollmentCounts[u.userId] > 1);

      if (!user) {
        const enrolledUserIds = new Set(data.enrollments.map(e => e.userId));
        user = data.users.find(u => u.role === 'teacher' && enrolledUserIds.has(u.userId));
      }
      
      if (!user) {
        const enrolledUserIds = new Set(data.enrollments.map(e => e.userId));
        user = data.users.find(u => u.role === 'student' && enrolledUserIds.has(u.userId));
      }

      if (!user) {
        throw new Error("Could not find any student or teacher with active enrollments.");
      }
      
      setLoggedInUser(user);
      
      const userEnrollments = data.enrollments.filter(e => e.userId === user.userId);
      const processedClasses = userEnrollments.map((enrollment, index) => {
        const teacherEnrollment = data.enrollments.find(e => e.classId === enrollment.classId && e.role === 'teacher');
        const teacher = teacherEnrollment ? data.users.find(u => u.userId === teacherEnrollment.userId) : null;
        const classInfo = data.classes.find(c => c.classId === enrollment.classId);

        return {
          key: `${enrollment.userId}-${enrollment.classId}-${index}`,
          classId: enrollment.classId,
          className: classInfo ? classInfo.className : `Class ${enrollment.classId}`,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A'
        };
      });

      setDashboardData({
        classData: processedClasses,
        allUsers: data.users,
        allEnrollments: data.enrollments
      });
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

    fetchData();
  }, []);
  
  const filteredClassData = dashboardData.classData.filter(c => 
    c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderDashboard = () => {
    if (!loggedInUser) return null;
    
    const props = {
      ...dashboardData,
      classData: filteredClassData,
      searchTerm: searchTerm
    };

    if (loggedInUser.role === 'teacher') {
      return <TeacherDashboard {...props} />;
    }
    
    return <StudentDashboard {...props} />;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
            <div className="logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3>My Classes</h3>
            <span className="separator">|</span>
            <h4>Dashboard</h4>
        </div>
        <div className="header-right" ref={dropdownRef}>
            <div className="profile-pic" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            {isDropdownOpen && <ProfileDropdown user={loggedInUser} />}
        </div>
      </header>
      <main className="dashboard-main">
        <div className="search-bar-container">
          <input 
            type="text" 
            placeholder="Search by Class Name or Teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
    
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {!loading && !error && renderDashboard()}
      </main>
    </div>
  );
}

export default App;
