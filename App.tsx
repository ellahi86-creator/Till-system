import React, { useState } from 'react';
import { LoginScreen } from './src/screens/LoginScreen';
import { SalesScreen } from './src/screens/SalesScreen';
import { setSession, type PosSession } from './src/services/session';

export default function App() {
  const [session, setAppSession] = useState<PosSession | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  if (session || demoMode) return <SalesScreen />;

  return (
    <LoginScreen
      onLogin={nextSession => {
        setSession(nextSession);
        setAppSession(nextSession);
      }}
      onDemoLogin={() => setDemoMode(true)}
    />
  );
}
