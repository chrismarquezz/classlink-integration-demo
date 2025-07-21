import React from 'react';

function StudentDashboard({ studentData }) {
  const classes = studentData?.classes || [];

  return (
    <table className="class-table">
      <thead>
        <tr>
          <th>Class Name</th>
          <th>Class ID</th>
        </tr>
      </thead>
      <tbody>
        {classes.length > 0 ? (
          classes.map(c => (
            <tr key={c.classId}>
              <td>{c.className}</td>
              <td>{c.classId}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="2" className="no-results">
              You are not currently enrolled in any classes.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default StudentDashboard;
