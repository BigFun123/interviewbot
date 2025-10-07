export default function Button({ icon, children, onClick, className = "" }) {
  return (
    <button
      className={`bg-gray-800 text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity touch-manipulation ${className}`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
