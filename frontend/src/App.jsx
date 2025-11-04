import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@components/Layout.jsx';
import { ProtectedRoute } from '@components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from '@context/AuthContext.jsx';
import { RegisterView } from '@views/RegisterView.jsx';
import { LoginView } from '@views/LoginView.jsx';
import { BankListView } from '@views/BankListView.jsx';
import { BankDetailView } from '@views/BankDetailView.jsx';
import { AccountDetailView } from '@views/AccountDetailView.jsx';

const LandingRedirect = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/banks' : '/login'} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<LandingRedirect />} />
      <Route path="register" element={<RegisterView />} />
      <Route path="login" element={<LoginView />} />
      <Route element={<ProtectedRoute />}>
        <Route path="banks" element={<BankListView />} />
        <Route path="banks/:institutionId" element={<BankDetailView />} />
        <Route
          path="banks/:institutionId/accounts/:accountId"
          element={<AccountDetailView />}
        />
      </Route>
    </Route>
  </Routes>
);

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};
