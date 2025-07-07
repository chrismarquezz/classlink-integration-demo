import { useState, useEffect, useRef } from "react";
import "./App.css";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import Login from "./components/Login";
import DashboardLayout from "./components/DashboardLayout";

import { Hub } from "aws-amplify/utils";
import { signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";

function App() {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    checkUser();
    const unsubscribe = Hub.listen("auth", ({ payload: { event, data } }) => {
      if (event === "signedIn") setUser(data);
      if (event === "signedOut") {
        setUser(null);
        setDashboardData(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_SECURE_API_URL;
    const fetchData = async () => {
      if (!API_URL || !user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        console.log("Cognito ID Token:", idToken);

        if (!idToken) throw new Error("User is not authenticated.");
        const response = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(
            data.error || `HTTP error! status: ${response.status}`
          );
        }

        setDashboardData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    console.log("Fetching from:", API_URL);

    fetchData();
  }, [user]);

  const renderDashboardContent = () => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error-message">Error: {error}</p>;
    if (!dashboardData) return null;

    const filteredClassData = dashboardData.classes.filter((c) =>
      c.className.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const userRole = dashboardData.userProfile?.role;
    if (userRole === "teacher") {
      const teacherProps = {
        ...dashboardData,
        classes: filteredClassData,
      };
      return <TeacherDashboard teacherData={teacherProps} />;
    }

    const studentProps = {
      ...dashboardData,
      classes: filteredClassData,
    };
    return <StudentDashboard studentData={studentProps} />;
  };

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
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by Class Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {renderDashboardContent()}
    </DashboardLayout>
  );
}

export default App;
