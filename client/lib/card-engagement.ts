'use client';

import { useSyncExternalStore } from 'react';

type EngagementState = {
  favorites: Record<string, true>;
  likes: Record<string, true>;
};

const STORAGE_KEY = 'cofounder-card-engagement';
const EVENT_NAME = 'cofounder-engagement-changed';
const listeners = new Set<() => void>();
let initialized = false;
const defaultState: EngagementState = {
  favorites: {},
  likes: {},
};
let cachedSnapshot: EngagementState = defaultState;
let cachedRawValue: string | null = null;

function getDefaultState(): EngagementState {
  return defaultState;
}

function ensureInitialized() {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      emit();
    }
  });
  window.addEventListener(EVENT_NAME, () => emit());
  initialized = true;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function readState(): EngagementState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  ensureInitialized();

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (rawValue === cachedRawValue) {
    return cachedSnapshot;
  }

  if (!rawValue) {
    cachedRawValue = null;
    cachedSnapshot = getDefaultState();
    return cachedSnapshot;
  }

  try {
    cachedRawValue = rawValue;
    cachedSnapshot = JSON.parse(rawValue) as EngagementState;
    return cachedSnapshot;
  } catch {
    cachedRawValue = rawValue;
    cachedSnapshot = getDefaultState();
    return cachedSnapshot;
  }
}

function writeState(nextState: EngagementState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function toggleRecord(record: Record<string, true>, cardId: string) {
  const nextRecord = { ...record };

  if (nextRecord[cardId]) {
    delete nextRecord[cardId];
  } else {
    nextRecord[cardId] = true;
  }

  return nextRecord;
}

export function useCardEngagementState() {
  return useSyncExternalStore(
    (listener) => {
      ensureInitialized();
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    readState,
    getDefaultState,
  );
}

export function useCardEngagement(cardId: string) {
  const state = useCardEngagementState();

  return {
    liked: Boolean(state.likes[cardId]),
    favorited: Boolean(state.favorites[cardId]),
    toggleFavorite() {
      const currentState = readState();
      writeState({
        ...currentState,
        favorites: toggleRecord(currentState.favorites, cardId),
      });
    },
    toggleLike() {
      const currentState = readState();
      writeState({
        ...currentState,
        likes: toggleRecord(currentState.likes, cardId),
      });
    },
  };
}
