import React from 'react';

// This component receives the Amplify user object and an onSignOut function
function ProfileDropdown({ user, onSignOut }) {
  if (!user) {
    return null;
  }

  // The Amplify user object stores attributes differently.
  // We access the username directly and other attributes via user.attributes.
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
      {/* The Sign Out button now calls the onSignOut function passed from App.jsx */}
      <div className="dropdown-item logout" onClick={onSignOut}>
        Sign Out
      </div>
    </div>
  );
}

export default ProfileDropdown;
