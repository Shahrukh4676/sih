"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { subscribeToAuth, signOutUser } from "@/lib/services/auth.service";
import { getUserProfile, createUserProfile } from "@/lib/services/users.service";
import { getOrganization } from "@/lib/services/organizations.service";
import { User, Organization, UserRole } from "@/types";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  organization: Organization | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  // Authorization helpers (UI convenience - server & security rules enforce true boundaries)
  hasRole: (roles: UserRole[]) => boolean;
  canCreate: () => boolean;
  canEdit: (contentUserId?: string) => boolean;
  canApprove: () => boolean;
  canPublish: () => boolean;
  canManageUsers: () => boolean;
  canManageAutomations: () => boolean;
  canViewAuditLogs: () => boolean;
  refreshProfile: () => Promise<void>;
  retryAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for timeout promises
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Hydrate from client localStorage on mount to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const cached = localStorage.getItem("nexus_user_profile");
      if (cached) {
        setUserProfile(JSON.parse(cached));
        setLoading(false);
      }
      const cachedOrg = localStorage.getItem("nexus_organization");
      if (cachedOrg) {
        setOrganization(JSON.parse(cachedOrg));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Fetch or sync user profile and organization from Firestore with timeout guards
  const loadUserData = useCallback(async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      setCurrentUser(null);
      setUserProfile(null);
      setOrganization(null);
      setLoading(false);
      setAuthError(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("nexus_user_profile");
          localStorage.removeItem("nexus_organization");
        } catch {
          // Ignore
        }
      }
      return;
    }

    setCurrentUser(fbUser);
    setAuthError(null);

    try {
      // 1. Fetch user profile with 3500ms timeout
      let profile = await withTimeout(getUserProfile(fbUser.uid), 3500, null);

      // If authenticated user doesn't have a profile yet in Firestore, create initial one
      if (!profile) {
        profile = await withTimeout(
          createUserProfile({
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            role: "ADMIN",
            organizationId: "org_primary",
          }),
          3500,
          null
        );
      }

      // Ensure user always has a valid organizationId
      const orgId = profile?.organizationId || "org_primary";
      const resolvedProfile: User = profile
        ? { ...profile, organizationId: orgId }
        : {
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            organizationId: orgId,
            role: "ADMIN",
            status: "ACTIVE",
            mfaEnabled: false,
            activeSessionsCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

      setUserProfile(resolvedProfile);

      // 2. Fetch organization with 3500ms timeout
      let org = await withTimeout(getOrganization(orgId), 3500, null);
      if (!org) {
        org = {
          id: orgId,
          organizationId: orgId,
          name: "Nexus Enterprise Primary",
          createdBy: fbUser.uid,
          status: "ACTIVE",
          slug: "nexus-enterprise-primary",
          tier: "ENTERPRISE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setOrganization(org);

      // Cache verified session
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("nexus_user_profile", JSON.stringify(resolvedProfile));
          localStorage.setItem("nexus_organization", JSON.stringify(org));
        } catch {
          // Ignore storage quota errors
        }
      }
    } catch (err) {
      console.error("[AuthContext] Error loading user & organization:", err);
      // Fallback session so user is never locked out on network degradation
      const fallbackProfile: User = {
        id: fbUser.uid,
        uid: fbUser.uid,
        email: fbUser.email || "",
        displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
        organizationId: "org_primary",
        role: "ADMIN",
        status: "ACTIVE",
        mfaEnabled: false,
        activeSessionsCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const fallbackOrg: Organization = {
        id: "org_primary",
        organizationId: "org_primary",
        name: "Nexus Enterprise Primary",
        createdBy: fbUser.uid,
        status: "ACTIVE",
        slug: "nexus-enterprise-primary",
        tier: "ENTERPRISE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUserProfile(fallbackProfile);
      setOrganization(fallbackOrg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Hard watchdog: Auth resolution MUST complete within 4000ms max
    const watchdog = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("[AuthContext] Watchdog forced loading=false after 4000ms");
          return false;
        }
        return false;
      });
    }, 4000);

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToAuth(
        (fbUser) => {
          clearTimeout(watchdog);
          loadUserData(fbUser);
        },
        (error) => {
          console.error("[AuthContext] Auth listener error:", error);
          clearTimeout(watchdog);
          setLoading(false);
          setAuthError(error.message || "Authentication service error.");
        }
      );
    } catch (err) {
      console.error("[AuthContext] Failed to attach auth listener:", err);
      clearTimeout(watchdog);
      setLoading(false);
      setAuthError("Failed to initialize authentication service.");
    }

    return () => {
      clearTimeout(watchdog);
      if (unsubscribe) unsubscribe();
    };
  }, [loadUserData]);

  const refreshProfile = useCallback(async () => {
    if (currentUser) {
      setLoading(true);
      await loadUserData(currentUser);
    }
  }, [currentUser, loadUserData]);

  const retryAuth = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    if (currentUser) {
      await loadUserData(currentUser);
    } else {
      // Re-trigger auth listener check
      const watchdog = setTimeout(() => setLoading(false), 3000);
      try {
        const unsub = subscribeToAuth(
          (u) => {
            clearTimeout(watchdog);
            loadUserData(u);
            unsub();
          },
          (err) => {
            clearTimeout(watchdog);
            setLoading(false);
            setAuthError(err.message || "Retry authentication failed.");
            unsub();
          }
        );
      } catch {
        clearTimeout(watchdog);
        setLoading(false);
      }
    }
  }, [currentUser, loadUserData]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOutUser();
    } catch (err) {
      console.error("[AuthContext] Logout error:", err);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      setOrganization(null);
      setAuthError(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("nexus_user_profile");
          localStorage.removeItem("nexus_organization");
        } catch {
          // Ignore
        }
      }
      setLoading(false);
    }
  }, []);

  const role = userProfile?.role || null;
  const isAuthenticated = !!currentUser || !!userProfile;

  // RBAC Helper functions
  const hasRole = useCallback((allowedRoles: UserRole[]) => {
    if (!role) return false;
    return allowedRoles.includes(role);
  }, [role]);

  // ADMIN, CREATOR, REVIEWER, EDITOR, SECURITY_OFFICER can create content
  const canCreate = useCallback(() => {
    return hasRole(["ADMIN", "CREATOR", "REVIEWER", "EDITOR", "SECURITY_OFFICER", "ORG_ADMIN", "SUPER_ADMIN"]);
  }, [hasRole]);

  // Creator can edit their own; Admin/Security Officer can edit any
  const canEdit = useCallback((contentUserId?: string) => {
    if (hasRole(["ADMIN", "ORG_ADMIN", "SUPER_ADMIN", "SECURITY_OFFICER"])) return true;
    if (contentUserId && userProfile?.uid === contentUserId) {
      return hasRole(["CREATOR", "EDITOR", "REVIEWER"]);
    }
    return false;
  }, [hasRole, userProfile]);

  // Only REVIEWER and ADMIN can approve content
  const canApprove = useCallback(() => {
    return hasRole(["ADMIN", "REVIEWER", "SECURITY_OFFICER", "ORG_ADMIN", "SUPER_ADMIN"]);
  }, [hasRole]);

  // Only ADMIN can publish content to social platforms
  const canPublish = useCallback(() => {
    return hasRole(["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"]);
  }, [hasRole]);

  // Only ADMIN can manage users and integrations
  const canManageUsers = useCallback(() => {
    return hasRole(["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"]);
  }, [hasRole]);

  // Only ADMIN can configure automations
  const canManageAutomations = useCallback(() => {
    return hasRole(["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"]);
  }, [hasRole]);

  // Only ADMIN can inspect audit logs
  const canViewAuditLogs = useCallback(() => {
    return hasRole(["ADMIN", "SECURITY_OFFICER", "ORG_ADMIN", "SUPER_ADMIN"]);
  }, [hasRole]);

  const value = useMemo(() => ({
    currentUser,
    userProfile,
    organization,
    role,
    loading,
    isAuthenticated,
    authError,
    hasRole,
    canCreate,
    canEdit,
    canApprove,
    canPublish,
    canManageUsers,
    canManageAutomations,
    canViewAuditLogs,
    refreshProfile,
    retryAuth,
    logout
  }), [
    currentUser,
    userProfile,
    organization,
    role,
    loading,
    isAuthenticated,
    authError,
    hasRole,
    canCreate,
    canEdit,
    canApprove,
    canPublish,
    canManageUsers,
    canManageAutomations,
    canViewAuditLogs,
    refreshProfile,
    retryAuth,
    logout
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
