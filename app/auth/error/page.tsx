'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  const getErrorMessage = () => {
    if (message) return message;
    
    switch (error) {
      case 'auth_failed':
        return 'Authentication failed. Please try again.';
      case 'access_denied':
        return 'Access was denied. Please try again.';
      case 'invalid_request':
        return 'Invalid request. Please try again.';
      case 'server_error':
        return 'Server error. Please try again later.';
      case 'temporarily_unavailable':
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  const handleRetry = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Error
        </h1>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">
            {getErrorMessage()}
          </p>
          {error && (
            <p className="text-red-600 text-xs mt-2">
              Error code: {error}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <button
            onClick={handleGoBack}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full animate-pulse mx-auto mb-6"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-6"></div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
