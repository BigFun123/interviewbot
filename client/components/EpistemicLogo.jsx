export default function EpistemicLogo({ className = "" }) {
  return (
    <div className={`flex items-center gap-1.5 select-none ${className}`}>
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      </div>
      <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
        Epistemic.co.za
      </span>
    </div>
  );
}
