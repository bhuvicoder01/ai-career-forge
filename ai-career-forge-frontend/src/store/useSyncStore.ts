import { create } from 'zustand';

interface SyncStatus {
  status: 'IDLE' | 'SYNCING' | 'COMPLETED' | 'FAILED';
  currentSkill?: string;
  progress?: number;
  total?: number;
}

interface SyncStore {
  syncStatus: SyncStatus;
  isConnected: boolean;
  setSyncStatus: (status: SyncStatus) => void;
  setConnected: (connected: boolean) => void;
  connect: () => void;
  disconnect: () => void;
}

let abortController: AbortController | null = null;

const useSyncStore = create<SyncStore>((set, get) => ({
  syncStatus: { status: 'IDLE' },
  isConnected: false,
  setSyncStatus: (status) => set({ syncStatus: status }),
  setConnected: (connected) => set({ isConnected: connected }),

  connect: () => {
    // Don't double-connect
    if (get().isConnected) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;

    // Clean up any existing connection
    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    set({ isConnected: true });

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

    const startStream = () => {
      if (!abortController) return;
      
      fetch(`${baseUrl}/jobs/sync-stream`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: abortController.signal,
      }).then(response => {
        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const data: SyncStatus = JSON.parse(line.substring(5).trim());
                  set({ syncStatus: data });
                } catch {
                  // ignore parse errors
                }
              }
            }
          }

          // Stream ended — try to reconnect after a brief pause
          if (get().isConnected) {
            setTimeout(startStream, 3000);
          }
        };

        processStream().catch(err => {
          if (err.name !== 'AbortError' && get().isConnected) {
            // Reconnect on error
            setTimeout(startStream, 3000);
          }
        });
      }).catch(err => {
        if (err.name !== 'AbortError' && get().isConnected) {
          setTimeout(startStream, 3000);
        }
      });
    };

    startStream();
  },

  disconnect: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    set({ isConnected: false });
  },
}));

export default useSyncStore;
