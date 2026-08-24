import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    setDialog({
      title: options?.title || "Are you sure?",
      message: options?.message || "This action cannot be undone.",
      confirmLabel: options?.confirmLabel || "Delete",
      cancelLabel: options?.cancelLabel || "Cancel",
      danger: options?.danger !== false,
    });
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (result) => {
    setDialog(null);
    if (resolveRef.current) resolveRef.current(result);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              {dialog.title}
            </h2>
            <p className="text-sm text-slate-600 mb-6">{dialog.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm"
              >
                {dialog.cancelLabel}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`px-4 py-2 rounded text-white text-sm ${dialog.danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
