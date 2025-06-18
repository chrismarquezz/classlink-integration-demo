import { useState, useEffect, useRef } from "react";
import "./App.css";
import ProfileDropdown from "./components/ProfileDropdown";

function App() {
  const [classData, setClassData] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const enrolledUserIds = new Set(data.enrollments.map((e) => e.userId));
      const anyEnrolledUser = data.users.find((u) =>
        enrolledUserIds.has(u.userId)
      );

      if (!anyEnrolledUser) {
        throw new Error(
          "Could not find any user in the users list that also exists in the enrollments list."
        );
      }

      setLoggedInUser(anyEnrolledUser);

      const userEnrollments = data.enrollments.filter(
        (e) => e.userId === anyEnrolledUser.userId
      );

      const processedClasses = userEnrollments.map((enrollment, index) => {
        const teacherEnrollment = data.enrollments.find(
          (e) => e.classId === enrollment.classId && e.role === "teacher"
        );
        const teacher = teacherEnrollment
          ? data.users.find((u) => u.userId === teacherEnrollment.userId)
          : null;

        return {
          key: `${enrollment.userId}-${enrollment.classId}-${index}`,
          className: `Class ${enrollment.classId}`,
          teacherName: teacher
            ? `${teacher.firstName} ${teacher.lastName}`
            : `(User ${enrollment.userId} as ${enrollment.role})`,
        };
      });

      setClassData(processedClasses);
    };

    const fetchData = async () => {
      if (!API_URL) {
        setError(
          "API URL is not configured. Please create a .env file with VITE_API_URL."
        );
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">A</div>
          <h3>My Classes</h3>
          <span className="separator">|</span>
          <h4>Dashboard</h4>
        </div>
        <div className="header-right" ref={dropdownRef}>
          <img
            src="https://placehold.co/40x40/EFEFEF/333333?text=P"
            alt="Profile"
            className="profile-pic"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          {isDropdownOpen && <ProfileDropdown user={loggedInUser} />}
        </div>
      </header>
      <main className="dashboard-main">
        <div className="search-bar-container">
          <input type="text" placeholder="Search by Name, Period, or Teacher" />
        </div>

        <table className="class-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Teacher / Role Info</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="2">Loading...</td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan="2" className="error-message">
                  Error: {error}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              classData.map((c) => (
                <tr key={c.key}>
                  <td>{c.className}</td>
                  <td>{c.teacherName}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default App;
