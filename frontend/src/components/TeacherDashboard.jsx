import React, { useState } from 'react';
import Modal from './Modal';

function TeacherDashboard({ classData, allUsers, allEnrollments }) {
  const [rosterClass, setRosterClass] = useState(null);

  const getStudentsForClass = (classId) => {
    return allEnrollments
      .filter(e => e.classId === classId && e.role === 'student')
      .map(enrollment => {
        const studentInfo = allUsers.find(u => u.userId === enrollment.userId);
        return studentInfo || { userId: enrollment.userId, firstName: 'Unknown', lastName: 'Student' };
      });
  };

  const handleClassClick = (classInfo) => {
    setRosterClass(classInfo);
  };

  const closeRoster = () => {
    setRosterClass(null);
  };
  
  const rosterStudents = rosterClass ? getStudentsForClass(rosterClass.classId) : [];

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
            {classData.map(c => (
              <tr 
                key={c.key} 
                onClick={() => handleClassClick(c)}
                className={rosterClass?.classId === c.classId ? 'selected-row' : ''}
              >
                <td>{c.className}</td>
                <td>{c.classId}</td>
              </tr>
            ))}
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
            {rosterStudents.length > 0 ? (
              rosterStudents.map(student => (
                <tr key={student.userId}>
                  <td>{student.firstName} {student.lastName}</td>
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
