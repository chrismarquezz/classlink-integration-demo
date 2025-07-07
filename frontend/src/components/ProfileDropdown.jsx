import React from 'react';

function ProfileDropdown({ user, onSignOut }) {
  if (!user) {
    return null;
  }

  const email = user.attributes?.email;
  const username = user.username;

  return (
    <div className="profile-dropdown">
      <div className="dropdown-item">
        <strong>Username:</strong> {username}
      </div>
      {email && (
        <div className="dropdown-item">
          <strong>Email:</strong> {email}
        </div>
      )}
      <div className="dropdown-item logout" onClick={onSignOut}>
        Sign Out
      </div>
    </div>
  );
}

export default ProfileDropdown;
