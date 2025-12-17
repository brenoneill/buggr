"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Note {
  id: string;
  timestamp: Date;
  title: string;
  messages: string[];
  read: boolean;
  branchName?: string;
  repoName?: string;
  repoOwner?: string;
}

export interface BranchChange {
  id: string;
  timestamp: Date;
  read: boolean;
  branchName: string;
  repoName: string;
  repoOwner: string;
  message: string;
  files: {
    file: string;
    success: boolean;
    changes?: string[];
  }[];
}

interface NotesContextType {
  notes: Note[];
  branchChanges: BranchChange[];
  unreadCount: number;
  unreadBranchChangesCount: number;
  addNote: (note: Omit<Note, "id" | "timestamp" | "read">) => void;
  addBranchChange: (change: Omit<BranchChange, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markBranchChangeAsRead: (id: string) => void;
  markAllAsRead: () => void;
  markAllBranchChangesAsRead: () => void;
  clearNotes: () => void;
  clearBranchChanges: () => void;
}

const NotesContext = createContext<NotesContextType | null>(null);

/**
 * Provides app-wide notes/notifications state.
 * Manages both bug reports (notes) and branch changes.
 * 
 * @param children - Child components that will have access to the notes context
 */
export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [branchChanges, setBranchChanges] = useState<BranchChange[]>([]);

  const addNote = useCallback((noteData: Omit<Note, "id" | "timestamp" | "read">) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotes((prev) => [newNote, ...prev]);
  }, []);

  const addBranchChange = useCallback((changeData: Omit<BranchChange, "id" | "timestamp" | "read">) => {
    const newChange: BranchChange = {
      ...changeData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setBranchChanges((prev) => [newChange, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, read: true } : note))
    );
  }, []);

  const markBranchChangeAsRead = useCallback((id: string) => {
    setBranchChanges((prev) =>
      prev.map((change) => (change.id === id ? { ...change, read: true } : change))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotes((prev) => prev.map((note) => ({ ...note, read: true })));
  }, []);

  const markAllBranchChangesAsRead = useCallback(() => {
    setBranchChanges((prev) => prev.map((change) => ({ ...change, read: true })));
  }, []);

  const clearNotes = useCallback(() => {
    setNotes([]);
  }, []);

  const clearBranchChanges = useCallback(() => {
    setBranchChanges([]);
  }, []);

  const unreadCount = notes.filter((n) => !n.read).length;
  const unreadBranchChangesCount = branchChanges.filter((c) => !c.read).length;

  return (
    <NotesContext.Provider
      value={{
        notes,
        branchChanges,
        unreadCount,
        unreadBranchChangesCount,
        addNote,
        addBranchChange,
        markAsRead,
        markBranchChangeAsRead,
        markAllAsRead,
        markAllBranchChangesAsRead,
        clearNotes,
        clearBranchChanges,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

/**
 * Hook to access the notes context.
 * 
 * @returns NotesContextType with notes state and actions
 * @throws Error if used outside of NotesProvider
 */
export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}

