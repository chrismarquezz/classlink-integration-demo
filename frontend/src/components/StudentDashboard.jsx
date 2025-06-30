import React from 'react';

function StudentDashboard({ classData, searchTerm }) {
  return (
    <table className="class-table">
      <thead>
        <tr>
          <th>Class Name</th>
          <th>Teacher</th>
        </tr>
      </thead>
      <tbody>
        {classData.length === 0 && searchTerm ? (
          <tr>
            <td colSpan="2" className="no-results">
              No classes found matching "{searchTerm}"
            </td>
          </tr>
        ) : (
          classData.map(c => (
            <tr key={c.key}>
              <td>{c.className}</td>
              <td>{c.teacherName}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default StudentDashboard;
