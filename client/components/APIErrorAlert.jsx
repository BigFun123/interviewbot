import { AlertTriangle, X, RefreshCw } from "react-feather";

export default function APIErrorAlert({ error, onClose, onRetry }) {
  if (!error) return null;

  const getErrorIcon = (type) => {
    switch (type) {
      case 'INVALID_KEY':
      case 'ACCESS_DENIED':
      case 'QUOTA_EXCEEDED':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'RATE_LIMITED':
        return <RefreshCw className="text-orange-500" size={20} />;
      default:
        return <AlertTriangle className="text-red-500" size={20} />;
    }
  };

  const getErrorColor = (type) => {
    switch (type) {
      case 'RATE_LIMITED':
        return 'border-orange-200 bg-orange-50';
      case 'SERVICE_ERROR':
      case 'NETWORK_ERROR':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  const getActionButton = (type) => {
    switch (type) {
      case 'INVALID_KEY':
      case 'INVALID_FORMAT':
      case 'ACCESS_DENIED':
      case 'QUOTA_EXCEEDED':
        return (
          <button
            onClick={onClose}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Update API Key
          </button>
        );
      case 'RATE_LIMITED':
      case 'SERVICE_ERROR':
      case 'NETWORK_ERROR':
        return (
          <button
            onClick={onRetry}
            className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        );
      default:
        return (
          <button
            onClick={onRetry}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Try Again
          </button>
        );
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getErrorColor(error.type)}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon(error.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            API Key Error
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            {error.message}
          </p>
          {error.debugKeyPrefix && (
            <p className="text-xs font-mono bg-gray-100 rounded px-2 py-1 mb-3 text-gray-600">
              DEBUG key used: {error.debugKeyPrefix}
            </p>
          )}
          <div className="flex items-center justify-between">
            {getActionButton(error.type)}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}