import { useState, useEffect } from "react";
import { FileText, X, ChevronDown, ChevronUp } from "react-feather";

export default function JobSpecification({ jobSpec, setJobSpec, isSessionActive }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localJobSpec, setLocalJobSpec] = useState(jobSpec);

  // Sync localJobSpec with jobSpec when jobSpec changes from outside
  useEffect(() => {
    setLocalJobSpec(jobSpec);
  }, [jobSpec]);

  const handleSave = () => {
    setJobSpec(localJobSpec.trim());
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setLocalJobSpec(jobSpec);
    setIsExpanded(false);
  };

  const handleClear = () => {
    setLocalJobSpec("");
    setJobSpec("");
  };

  const wordCount = localJobSpec.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = localJobSpec.length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => !isSessionActive && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-500" />
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Job Specification (optional)</h3>
            <p className="text-xs text-gray-500">
              {jobSpec ? `${wordCount} words` : "Add job description to customize interview"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {jobSpec && (
            <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Active
            </div>
          )}
          {!isSessionActive && (
            isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && !isSessionActive && (
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="job-spec-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                Paste the job description or requirements:
              </label>
              <textarea
                id="job-spec-textarea"
                value={localJobSpec}
                onChange={(e) => setLocalJobSpec(e.target.value)}
                placeholder="Paste the job description or requirements here...

Example:
Senior React Developer at TechCorp
- 5+ years of React experience
- Knowledge of TypeScript, Redux, and testing frameworks  
- Experience with modern build tools (Webpack, Vite) and CI/CD
- Strong understanding of web performance optimization
- Bachelor's degree in Computer Science or equivalent experience
- Experience with Agile development methodologies
- Excellent communication and teamwork skills

The AI interviewer will tailor questions based on these specific requirements."
                className="w-full h-48 sm:h-64 p-3 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={5000}
              />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>{charCount}/5000 characters</span>
                <span>{wordCount} words</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={localJobSpec.trim().length === 0}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save Job Spec
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Content Preview */}
      {!isExpanded && jobSpec && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <p className="text-xs text-gray-600 line-clamp-2">
            {jobSpec.slice(0, 150)}{jobSpec.length > 150 ? "..." : ""}
          </p>
        </div>
      )}

      {/* Session Active Notice */}
      {isSessionActive && (
        <div className="border-t border-gray-200 p-3 bg-amber-50">
          <p className="text-xs text-amber-700">
            Job specification is locked during active interview session
          </p>
        </div>
      )}
    </div>
  );
}