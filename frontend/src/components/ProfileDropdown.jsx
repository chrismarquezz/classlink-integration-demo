
function ProfileDropdown({ user, onSignOut }) {
  if (!user) {
    return null;
  }

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
          <strong>Role:</strong> {role && role.charAt(0).toUpperCase() + role.slice(1)}
      </div>
      <div className="dropdown-item logout" onClick={onSignOut}>
        Sign Out
      </div>
    </div>
  );
}

export default ProfileDropdown;
