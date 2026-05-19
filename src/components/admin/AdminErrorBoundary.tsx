'use client';

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-error-boundary">
          <div className="error-card">
            <span style={{ fontSize: '2.5rem', color: 'var(--gold)' }}><svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg></span>
            <h2>Something went wrong</h2>
            <p>An unexpected error occurred in the admin panel. This has been logged.</p>
            <code>{this.state.error?.message || 'Unknown error'}</code>
            <div className="actions" style={{ marginTop: 16 }}>
              <button className="btn gold" onClick={() => this.setState({ hasError: false })}>Try again</button>
              <button className="btn outline" onClick={() => window.location.href = '/admin/dashboard'}>Go to Dashboard</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
