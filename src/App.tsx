import React, { useCallback, useEffect, useState } from 'react';
import { CVWorkspace } from './components/CVWorkspace';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginView } from './components/auth/LoginView';
import type { SafeUser } from './types/auth';
import {
  buildWebSocketUrl,
  fetchCurrentSession,
  getInMemorySessionToken,
  logoutSession,
  setInMemorySessionToken,
} from './utils/authApi';

type AuthenticatedView = 'admin' | 'cv';

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [activeView, setActiveView] = useState<AuthenticatedView>('cv');
  const [revokedNotice, setRevokedNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchCurrentSession()
      .then((res) => {
        if (!active) return;
        if (res.authenticated && res.user) {
          setCurrentUser(res.user);
          setActiveView(res.user.role === 'admin' ? 'admin' : 'cv');
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Real-time session revocation listener for normal users:
  // If the Admin disables, rejects, deletes, or resets a user's password, they are signed out immediately.
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') {
      return;
    }

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (cancelled) return;
      ws = new WebSocket(buildWebSocketUrl());

      ws.onopen = () => {
        const token = getInMemorySessionToken();
        if (token) {
          ws?.send(JSON.stringify({ type: 'auth', token }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type?: string; reason?: string };
          if (msg.type === 'session:revoked') {
            setInMemorySessionToken(null);
            setCurrentUser(null);
            setRevokedNotice(
              msg.reason || 'تم إنهاء جلستك من قِبل مدير النظام.'
            );
          }
        } catch {
          // Ignore malformed WS payloads
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        reconnectTimer = window.setTimeout(() => {
          void fetchCurrentSession()
            .then((res) => {
              if (cancelled) return;
              if (!res.authenticated || !res.user) {
                setCurrentUser(null);
                setRevokedNotice('تم إنهاء جلستك أو تعديل صلاحيات حسابك.');
              } else {
                connect();
              }
            })
            .catch(() => {
              if (!cancelled) connect();
            });
        }, 4000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [currentUser]);

  const handleAuthenticated = useCallback((user: SafeUser) => {
    setRevokedNotice(null);
    setCurrentUser(user);
    setActiveView(user.role === 'admin' ? 'admin' : 'cv');
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutSession();
    setCurrentUser(null);
    setActiveView('cv');
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold text-slate-700">
          جارٍ التحقق من الجلسة...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        onAuthenticated={handleAuthenticated}
        revokedNotice={revokedNotice}
        onDismissNotice={() => setRevokedNotice(null)}
      />
    );
  }

  if (currentUser.role === 'admin' && activeView === 'admin') {
    return (
      <AdminDashboard
        adminUser={currentUser}
        onOpenCVStudio={() => setActiveView('cv')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <CVWorkspace
      currentUser={currentUser}
      onOpenAdminDashboard={
        currentUser.role === 'admin' ? () => setActiveView('admin') : undefined
      }
      onLogout={handleLogout}
    />
  );
}
