import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };
const Ctx = createContext<{ push: (msg: string, type?: Toast['type']) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, message, type }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed top-5 left-5 z-[100] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`glass px-4 py-3 min-w-[260px] animate-fade-in border-r-4 ${
              t.type === 'success' ? 'border-r-forti-green' : t.type === 'error' ? 'border-r-forti-red' : 'border-r-forti-accent'
            }`}
          >
            <div className="text-sm font-medium">{t.message}</div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
