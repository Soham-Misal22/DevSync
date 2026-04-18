const Skeleton = ({ lines = 3, className = "" }) => {
    return (
        <div className={`animate-pulse space-y-4 ${className}`}>
            {[...Array(lines)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-800/60 rounded-xl w-full"></div>
            ))}
        </div>
    );
};

export default Skeleton;
