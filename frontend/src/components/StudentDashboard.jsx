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
        {classData.length > 0 ? (
          classData.map(c => (
            <tr key={c.key}>
              <td>{c.className}</td>
              <td>{c.teacherName}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="2" className="no-results">
              {searchTerm
                ? `No classes found matching "${searchTerm}"`
                : "You are not currently enrolled in any classes."}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default StudentDashboard;
