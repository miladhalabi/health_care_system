const EmptyState = ({ message, description, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-base-200 p-6 rounded-full mb-4 opacity-40">
        {icon || (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-bold opacity-80">{message}</h3>
      {description && <p className="text-sm opacity-50 mt-2 max-w-xs mx-auto">{description}</p>}
    </div>
  );
};

export default EmptyState;
