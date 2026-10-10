/**
 * Archivo: App.tsx
 * Descripción: Componente raíz — define el enrutamiento de la aplicación.
 * ¿Para qué? Centralizar TODAS las rutas en un solo lugar facilita entender
 *   la estructura de navegación del sistema de un vistazo.
 * ¿Impacto? Una ruta mal configurada puede hacer que una página sea inaccesible
 *   o que una ruta protegida quede expuesta sin autenticación o al rol equivocado.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ToastProvider } from '@/context/ToastProvider';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModalProvider } from '@/context/AuthModalProvider';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { PricingInfoPage } from '@/pages/PricingInfoPage';
import { TermsPage } from '@/pages/legal/TermsPage';
import { PrivacyPage } from '@/pages/legal/PrivacyPage';
import { ClientHomePage } from '@/pages/client/ClientHomePage';
import { ProfileDashboardPage } from '@/pages/client/profile/ProfileDashboardPage';
import { ProfilePersonalDataPage } from '@/pages/client/profile/ProfilePersonalDataPage';
import { ProfilePetsPage } from '@/pages/client/profile/ProfilePetsPage';
import { ProfileHistoryPage } from '@/pages/client/profile/ProfileHistoryPage';
import { AppointmentPage } from '@/pages/client/AppointmentPage';
import { SymptomReportPage } from '@/pages/client/SymptomReportPage';
import { EmergencyPage } from '@/pages/client/EmergencyPage';
import { ShopPage } from '@/pages/client/ShopPage';
import { StaffHomePage } from '@/pages/staff/StaffHomePage';
import { StaffAgendaPage } from '@/pages/staff/StaffAgendaPage';
import { StaffPetsPage } from '@/pages/staff/StaffPetsPage';
import { StaffSymptomsPage } from '@/pages/staff/StaffSymptomsPage';
import { StaffServicesPage } from '@/pages/staff/StaffServicesPage';
import { StaffPricingPage } from '@/pages/staff/StaffPricingPage';
import { StaffProductsPage } from '@/pages/staff/StaffProductsPage';
import { StaffOrdersPage } from '@/pages/staff/StaffOrdersPage';
import { StaffSuppliersPage } from '@/pages/staff/StaffSuppliersPage';
import { StaffSupplierOrdersPage } from '@/pages/staff/StaffSupplierOrdersPage';
import { StaffSalesPage } from '@/pages/staff/StaffSalesPage';
import { StaffSalesReportPage } from '@/pages/staff/StaffSalesReportPage';
import { StaffCreateAccountPage } from '@/pages/staff/StaffCreateAccountPage';
import { StaffClientsPage } from '@/pages/staff/StaffClientsPage';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AuthModalProvider>
        <Routes>
          {/* ─── Rutas públicas — accesibles sin autenticación ─── */}
          <Route path="/" element={<Layout><LandingPage /></Layout>} />
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
          <Route path="/forgot-password" element={<Layout><ForgotPasswordPage /></Layout>} />
          <Route path="/reset-password" element={<Layout><ResetPasswordPage /></Layout>} />
          <Route path="/verify-email" element={<Layout><VerifyEmailPage /></Layout>} />
          <Route path="/precios" element={<Layout><PricingInfoPage /></Layout>} />
          <Route path="/terminos" element={<Layout><TermsPage /></Layout>} />
          <Route path="/privacidad" element={<Layout><PrivacyPage /></Layout>} />

          {/* ─── Zona del cliente — solo role: client ─── */}
          <Route
            path="/app"
            element={
              <ProtectedRoute role="client">
                <Layout><ClientHomePage /></Layout>
              </ProtectedRoute>
            }
          />
          {/* ¿Qué? Igual que /staff: un único ProtectedRoute + ClientLayout envuelve las
             4 secciones del perfil (Dashboard, Datos personales, Mis mascotas, Historial),
             cada una con su propio menú lateral en vez del Navbar/Footer públicos. */}
          <Route
            path="/app/perfil"
            element={
              <ProtectedRoute role="client">
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProfileDashboardPage />} />
            <Route path="datos" element={<ProfilePersonalDataPage />} />
            <Route path="mascotas" element={<ProfilePetsPage />} />
            <Route path="historial" element={<ProfileHistoryPage />} />
          </Route>
          <Route
            path="/app/cita"
            element={
              <ProtectedRoute role="client">
                <Layout><AppointmentPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/sintoma"
            element={
              <ProtectedRoute role="client">
                <Layout><SymptomReportPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/emergencia"
            element={
              <ProtectedRoute role="client">
                <Layout><EmergencyPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/tienda"
            element={
              <ProtectedRoute role="client">
                <Layout><ShopPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ─── Zona del staff — solo role: staff ─── */}
          {/* ¿Qué? Un único ProtectedRoute + StaffLayout envuelve todas las sub-rutas.
             ¿Para qué? StaffLayout trae su propio sidebar de navegación (reemplaza el
               Navbar/Footer públicos) — repetirlo por página duplicaría el chequeo de rol
               y el layout en cada una. Las rutas hijas son relativas y se renderizan en
               el <Outlet/> de StaffLayout. */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute role="staff">
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StaffHomePage />} />
            <Route path="clientes" element={<StaffClientsPage />} />
            <Route path="agenda" element={<StaffAgendaPage />} />
            <Route path="mascotas" element={<StaffPetsPage />} />
            <Route path="sintomas" element={<StaffSymptomsPage />} />
            <Route path="servicios" element={<StaffServicesPage />} />
            <Route path="tarifario" element={<StaffPricingPage />} />
            <Route path="productos" element={<StaffProductsPage />} />
            <Route path="pedidos" element={<StaffOrdersPage />} />
            <Route path="proveedores" element={<StaffSuppliersPage />} />
            <Route path="pedidos-proveedor" element={<StaffSupplierOrdersPage />} />
            <Route path="ventas" element={<StaffSalesPage />} />
            <Route path="reporte-ventas" element={<StaffSalesReportPage />} />
            <Route path="nueva-cuenta" element={<StaffCreateAccountPage />} />
          </Route>

          {/* ─── Común a ambos roles ─── */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <Layout><ChangePasswordPage /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <Layout>
                <div className="min-h-[60vh] flex items-center justify-center">
                  <p className="text-text-muted text-sm">
                    404 — Página no encontrada
                  </p>
                </div>
              </Layout>
            }
          />
        </Routes>
            </AuthModalProvider>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
