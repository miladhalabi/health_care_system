const StatCard = ({ title, value, desc, icon, color = "primary" }) => {
  return (
    <div className="card bg-base-100 border-r-4 border-primary">
      <div className="card-body p-6 flex-row items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-slate-100 text-primary flex items-center justify-center text-2xl shadow-inner">
          {icon}
        </div>
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</div>
          <div className="text-3xl font-black text-slate-800 mt-0.5">{value}</div>
          {desc && <div className="text-[10px] mt-1 font-bold text-slate-400">{desc}</div>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
