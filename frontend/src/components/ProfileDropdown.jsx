function ProfileDropdown({ user }) {
  const displayUser = user || {
    firstName: 'Test',
    lastName: 'User',
    userId: '12345',
    role: 'student'
  };

  return (
    <div className="profile-dropdown">
      <div className="dropdown-item">
        <strong>Name:</strong> {displayUser.firstName} {displayUser.lastName}
      </div>
      <div className="dropdown-item">
        <strong>User ID:</strong> {displayUser.userId}
      </div>
      <div className="dropdown-item">
        <strong>Role:</strong> {displayUser.role.charAt(0).toUpperCase() + displayUser.role.slice(1)}
      </div>
      <div className="dropdown-item logout">
        Logout
      </div>
    </div>
  );
}

export default ProfileDropdown;
