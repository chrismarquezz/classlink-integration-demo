import { useState } from 'react';
import Modal from './Modal';

function TeacherDashboard({ teacherData }) {
  const [rosterClass, setRosterClass] = useState(null);

  const handleClassClick = (classInfo) => {
    setRosterClass(classInfo);
  };

  const closeRoster = () => {
    setRosterClass(null);
  };
  
  return (
    <>
      <div className="teacher-class-list">
        <h4 style={{ color: 'black' }}>Your Classes</h4>
        <table className="class-table clickable-table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Class ID</th>
            </tr>
          </thead>
          <tbody>
            {teacherData.classes.length > 0 ? (
              teacherData.classes.map(c => (
                <tr 
                  key={c.classId} 
                  onClick={() => handleClassClick(c)}
                  className={rosterClass?.classId === c.classId ? 'selected-row' : ''}
                >
                  <td>{c.className}</td>
                  <td>{c.classId}</td>
                </tr>
              ))
            ) : (
               <tr>
                <td colSpan="2" className="no-results">
                  You are not currently assigned to any classes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        show={rosterClass !== null} 
        onClose={closeRoster}
        title={`Student Roster for ${rosterClass?.className}`}
      >
        <table className="class-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Student ID</th>
            </tr>
          </thead>
          <tbody>
            {rosterClass?.roster?.length > 0 ? (
              rosterClass.roster.map(student => (
                <tr key={student.userId}>
                  <td>{student.firstName && student.lastName 
                      ? `${student.firstName} ${student.lastName}` 
                      : `Student ${student.userId}`}</td>
                  <td>{student.userId}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No students found for this class.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Modal>
    </>
  );
}

export default TeacherDashboard;
