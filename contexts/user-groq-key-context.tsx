"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserGroqKeyContextType {
  apiKey: string | null;
  saveKey: (key: string) => void;
  clearKey: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const UserGroqKeyContext = createContext<UserGroqKeyContextType | undefined>(undefined);

export function UserGroqKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user_groq_api_key");
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  const saveKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem("user_groq_api_key", trimmed);
    setIsModalOpen(false);
  };

  const clearKey = () => {
    setApiKey(null);
    localStorage.removeItem("user_groq_api_key");
  };

  return (
    <UserGroqKeyContext.Provider
      value={{
        apiKey,
        saveKey,
        clearKey,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </UserGroqKeyContext.Provider>
  );
}

export function useUserGroqKey() {
  const context = useContext(UserGroqKeyContext);
  if (context === undefined) {
    throw new Error("useUserGroqKey must be used within a UserGroqKeyProvider");
  }
  return context;
}
