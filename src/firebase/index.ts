'use client';

// This file is now a barrel file for exporting hooks and providers.
// The initialization logic has been moved to FirebaseClientProvider to ensure
// it only runs on the client and to simplify the overall structure.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
