import { useState, useEffect } from "react";
import { Key, X, ChevronDown, ChevronUp, Eye, EyeOff } from "react-feather";

export default function APIKeyInput({ apiKey, setApiKey, isSessionActive }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key');
    if (savedApiKey && !apiKey) {
      setApiKey(savedApiKey);
      setLocalApiKey(savedApiKey);
    }
  }, [apiKey, setApiKey]);

  const handleSave = () => {
    const trimmedKey = localApiKey.trim();
    setApiKey(trimmedKey);
    // Save to localStorage for persistence
    if (trimmedKey) {
      localStorage.setItem('openai-api-key', trimmedKey);
    } else {
      localStorage.removeItem('openai-api-key');
    }
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setLocalApiKey(apiKey);
    setIsExpanded(false);
  };

  const handleClear = () => {
    setLocalApiKey("");
    setApiKey("");
    localStorage.removeItem('openai-api-key');
  };

  const isValidKey = localApiKey.trim().startsWith('sk-') && localApiKey.trim().length > 20;
  const maskedKey = apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : '';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => !isSessionActive && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Key size={18} className="text-purple-500" />
          <div>
            <h3 className="font-semibold text-sm text-gray-800">OpenAI API Key (Optional)</h3>
            <p className="text-xs text-gray-500">
              {apiKey ? `Key: ${maskedKey}` : "Add your OpenAI API key to use your own quota"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {apiKey && (
            <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              Set
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
              <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your OpenAI API Key:
              </label>
              <div className="relative">
                <input
                  id="api-key-input"
                  type={showKey ? "text" : "password"}
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="sk-proj-... (your OpenAI API key)"
                  className="w-full pr-10 p-3 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={200}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>
                  {isValidKey ? (
                    <span className="text-green-600">✓ Valid API key format</span>
                  ) : localApiKey.trim() ? (
                    <span className="text-red-600">Invalid API key format</span>
                  ) : (
                    "API key should start with 'sk-'"
                  )}
                </span>
                <span>{localApiKey.length}/200 characters</span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Your API key is stored locally in your browser and sent directly to OpenAI. 
                If no key is provided, the server's default key will be used. Your key is never stored on our servers.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!localApiKey.trim() || !isValidKey}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save API Key
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
      {!isExpanded && apiKey && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <p className="text-xs text-gray-600 font-mono">
            {maskedKey}
          </p>
        </div>
      )}

      {/* Session Active Notice */}
      {isSessionActive && (
        <div className="border-t border-gray-200 p-3 bg-amber-50">
          <p className="text-xs text-amber-700">
            API key is locked during active interview session
          </p>
        </div>
      )}
    </div>
  );
}