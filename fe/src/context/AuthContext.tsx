/**
 * Archivo: context/AuthContext.tsx
 * Descripción: Provider del contexto global de autenticación — estado del usuario y tokens JWT.
 * ¿Para qué? Compartir el estado de autenticación (usuario, tokens, loading) en
 *   toda la aplicación sin necesidad de prop drilling.
 * ¿Impacto? Sin este contexto cada componente tendría que leer localStorage
 *   directamente y manejar su propio estado de auth — imposible de mantener.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '@/api/auth';
import type { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { AuthContext } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // ¿Qué? El estado inicial ya refleja si hay un token guardado — así el efecto de
  //   abajo nunca necesita un setState síncrono en la rama "no hay token".
  // ¿Para qué? Cumplir react-hooks/set-state-in-effect: un efecto solo debe llamar
  //   setState desde un callback asíncrono (then/catch/finally), no en su cuerpo síncrono.
  const [isLoading, setIsLoading] = useState<boolean>(
    () => localStorage.getItem('accessToken') !== null,
  );

  // ¿Qué? Al cargar la app, si hay un token guardado, intentar cargar el perfil.
  // ¿Para qué? Restaurar la sesión del usuario si ya se había autenticado antes.
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    authApi
      .getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ¿Qué? Función de login — guarda tokens y el usuario que ya trae la respuesta (RF-002).
  const login = useCallback(async (data: LoginRequest): Promise<User> => {
    const response = await authApi.login(data);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    const profile = await authApi.getMe();
    setUser(profile);
    return profile;
  }, []);

  // ¿Qué? Función de registro — registra al cliente; NO hace login automático porque
  //   la cuenta queda sin verificar hasta que el usuario haga clic en el enlace del correo.
  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  // ¿Qué? Re-lee el perfil del backend y lo refresca en el contexto.
  const refreshUser = useCallback(async () => {
    const profile = await authApi.getMe();
    setUser(profile);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
