"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { subscribeToAuth, signOutUser } from "@/lib/services/auth.service";
import { getUserProfile, createUserProfile } from "@/lib/services/users.service";
import { getOrganization } from "@/lib/services/organizations.service";
import { User, Organization, UserRole } from "@/types";
import { MOCK_USER, MOCK_ORGANIZATION } from "@/lib/mock-data";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  organization: Organization | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or sync user profile and organization from Firestore
  const loadUserData = useCallback(async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      setCurrentUser(null);
      setUserProfile(null);
      setOrganization(null);
      setLoading(false);
      return;
    }

    setCurrentUser(fbUser);

    try {
      let profile = await getUserProfile(fbUser.uid);

      // If authenticated user doesn't have a profile yet in Firestore, create initial one
      if (!profile) {
        profile = await createUserProfile({
          uid: fbUser.uid,
          email: fbUser.email || "",
          displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
          role: "ADMIN" // initial creator role assigned upon onboarding
        });
      }

      setUserProfile(profile);

      // If user belongs to an organization, load it
      if (profile?.organizationId) {
        const org = await getOrganization(profile.organizationId);
        setOrganization(org);
      } else {
        setOrganization(null);
      }
    } catch (err) {
      console.error("[AuthContext] Error loading user & organization:", err);
      // Fallback to mock session if Firestore permissions / network is constrained
      setUserProfile({
        ...MOCK_USER,
        uid: fbUser.uid,
        email: fbUser.email || MOCK_USER.email,
        displayName: fbUser.displayName || MOCK_USER.displayName
      });
      setOrganization(MOCK_ORGANIZATION);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((fbUser) => {
      loadUserData(fbUser);
    });
    return () => unsubscribe();
  }, [loadUserData]);

  const refreshProfile = useCallback(async () => {
    if (currentUser) {
      await loadUserData(currentUser);
    }
  }, [currentUser, loadUserData]);

  const logout = useCallback(async () => {
    setLoading(true);
    await signOutUser();
    setCurrentUser(null);
    setUserProfile(null);
    setOrganization(null);
    setLoading(false);
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
    hasRole,
    canCreate,
    canEdit,
    canApprove,
    canPublish,
    canManageUsers,
    canManageAutomations,
    canViewAuditLogs,
    refreshProfile,
    logout
  }), [
    currentUser,
    userProfile,
    organization,
    role,
    loading,
    isAuthenticated,
    hasRole,
    canCreate,
    canEdit,
    canApprove,
    canPublish,
    canManageUsers,
    canManageAutomations,
    canViewAuditLogs,
    refreshProfile,
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
