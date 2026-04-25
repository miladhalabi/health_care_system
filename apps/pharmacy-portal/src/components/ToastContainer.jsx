import useToastStore from '../store/useToastStore';

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="toast toast-top toast-center z-[100] min-w-[300px]">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`alert ${
            toast.type === 'success' ? 'alert-success' : 'alert-error'
          } shadow-lg rounded-2xl border-none text-white font-bold animate-in slide-in-from-top-4 duration-300`}
        >
          <div className="flex items-center gap-3 justify-between w-full">
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="btn btn-ghost btn-xs btn-circle">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
