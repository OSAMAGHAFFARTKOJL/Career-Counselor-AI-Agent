"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserGroqKey } from '@/contexts/user-groq-key-context';

export function ApiKeyModal() {
  const { apiKey, saveKey, isModalOpen, setIsModalOpen } = useUserGroqKey();
  const [keyInput, setKeyInput] = useState(apiKey || '');

  if (!isModalOpen) return null;

  const handleSave = () => {
    if (keyInput.trim()) {
      saveKey(keyInput.trim());
      setKeyInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Enter your Groq API Key</h2>
          <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          The default AI services are currently unavailable. Please enter your own Groq API key to continue using all features.
        </p>
        <Input
          type="password"
          placeholder="gsk_..."
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-4"
        />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={!keyInput.trim()}>
            Save Key
          </Button>
        </div>
      </div>
    </div>
  );
}
