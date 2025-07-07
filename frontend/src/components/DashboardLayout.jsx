import React from 'react';

function DashboardLayout({ children, dropdownRef, isDropdownOpen, user, onSignOut, onProfileClick }) {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
            <div className="logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3>My Classes</h3>
            <span className="separator">|</span>
            <h4>Dashboard</h4>
        </div>
        <div className="header-right" ref={dropdownRef}>
            <div className="profile-pic" onClick={onProfileClick}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            {isDropdownOpen && <ProfileDropdown user={user} onSignOut={onSignOut} />}
        </div>
      </header>
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}

import ProfileDropdown from './ProfileDropdown';

export default DashboardLayout;
