const StatCard = ({ title, value, desc, icon, color = "primary" }) => {
  return (
    <div className="card-nhr border-r-4 border-primary">
      <div className="p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-surface-bg text-primary flex items-center justify-center text-2xl shadow-inner">
          {icon}
        </div>
        <div>
          <div className="text-xs font-bold text-content-muted uppercase tracking-widest">{title}</div>
          <div className="text-3xl font-black text-content mt-0.5">{value}</div>
          {desc && <div className="text-[10px] mt-1 font-bold text-content-muted">{desc}</div>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
