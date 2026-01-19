import { SignIn } from '@clerk/clerk-react';
import './ClerkLogin.css';

const signInAppearance = {
  variables: {
    colorPrimary: '#2563eb',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    colorBackground: '#ffffff',
    colorInputBackground: '#f8fafc',
    colorInputText: '#0f172a',
    borderRadius: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  elements: {
    card: 'clerk-card',
    headerTitle: 'clerk-title',
    headerSubtitle: 'clerk-subtitle',
    formButtonPrimary: 'clerk-primary-btn',
    footerActionLink: 'clerk-footer-link',
    formFieldInput: 'clerk-input',
    formFieldLabel: 'clerk-label',
  },
};

export default function ClerkLogin() {
  return (
    <div className="clerk-login-page">
      <div className="clerk-login-left">
        <div className="clerk-login-brand">
          <span className="clerk-login-logo">BMW Admin</span>
          <span className="clerk-login-badge">Inventory & Operations</span>
        </div>
        <div className="clerk-login-copy">
          <h1>Welcome back</h1>
          <p>Manage catalog, inventory, and operations from one secure dashboard.</p>
        </div>
        <div className="clerk-login-footer">
          <span>Solidoro Platform</span>
          <span className="clerk-login-dot" />
          <span>Australia Region</span>
        </div>
      </div>
      <div className="clerk-login-right">
        <SignIn
          routing="hash"
          signUpUrl={undefined}
          appearance={signInAppearance}
        />
      </div>
    </div>
  );
}
