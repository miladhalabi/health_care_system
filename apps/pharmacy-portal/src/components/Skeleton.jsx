const Skeleton = ({ className }) => {
  return (
    <div className={`animate-pulse bg-stone-100 rounded-xl ${className}`}></div>
  );
};

export default Skeleton;
