import React from 'react';

// This component now receives the user profile from our database and an onSignOut function
function ProfileDropdown({ user, onSignOut }) {
  // This check is still important
  if (!user) {
    return null;
  }

  // Read the properties from our database user object
  const firstName = user.firstName;
  const lastName = user.lastName;
  const email = user.email;
  const role = user.role;

  return (
    <div className="profile-dropdown">
      <div className="dropdown-item">
        <strong>Name:</strong> {firstName} {lastName}
      </div>
      {email && email !== 'N/A' && (
        <div className="dropdown-item">
          <strong>Email:</strong> {email}
        </div>
      )}
      <div className="dropdown-item">
        <strong>Role:</strong> {role}
      </div>
      {/* The Sign Out button now correctly calls the onSignOut function */}
      <div className="dropdown-item logout" onClick={onSignOut}>
        Sign Out
      </div>
    </div>
  );
}

export default ProfileDropdown;
