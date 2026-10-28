'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

function GoogleSignInButtonInner({
  isSignUp = false,
  clientId,
}: {
  isSignUp?: boolean;
  clientId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string>();
  const [hashedNonce, setHashedNonce] = useState<string>();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const generateNonce = async () => {
      const newNonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      const encoder = new TextEncoder();
      const encodedNonce = encoder.encode(newNonce);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const newHashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setNonce(newNonce);
      setHashedNonce(newHashedNonce);
    };
    generateNonce();
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      setError(null);
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="w-full space-y-4 flex flex-col items-center">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm flex items-center gap-2 w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <div className="w-full flex justify-center">
          {hashedNonce ? (
            <GoogleLogin
              nonce={hashedNonce}
              onSuccess={handleCredentialResponse}
              onError={() => {
                setError('Google Sign-In failed. Please sign in with email & password below.');
              }}
              useOneTap={false}
              theme="outline"
              shape="rectangular"
              text={isSignUp ? "signup_with" : "signin_with"}
            />
          ) : (
            <div className="h-10 bg-muted animate-pulse rounded-md w-full max-w-[200px]" />
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default function GoogleSignInButton({ isSignUp = false }: { isSignUp?: boolean }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';
  const isConfigured = Boolean(
    clientId.length > 0 &&
    !clientId.includes('776003471590') // Guard against suspended project client
  );

  if (!isConfigured) {
    return (
      <div className="w-full p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200/90 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-semibold text-amber-300">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Google Sign-In Maintenance</span>
        </div>
        <p>Google OAuth credential rotation is in progress. Please use <strong>Email and Password</strong> below.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded-md w-full" />}>
      <GoogleSignInButtonInner isSignUp={isSignUp} clientId={clientId} />
    </Suspense>
  );
}
