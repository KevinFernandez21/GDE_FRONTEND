/**
 * Firebase configuration and initialization
 * 
 * This file initializes Firebase services (Auth, Firestore, Storage)
 * for use throughout the application.
 * 
 * Setup instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable Authentication (Email/Password)
 * 3. Create a web app and copy the config
 * 4. Add the config to .env.local (see FIREBASE_SETUP_GUIDE.md)
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate configuration
const validateConfig = () => {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Firebase configuration incomplete. Missing:', missing)
      console.warn('📝 See FIREBASE_SETUP_GUIDE.md for setup instructions')
    }
    return false
  }

  return true
}

// Initialize Firebase (only once - prevents multiple initializations)
let app: FirebaseApp

if (getApps().length === 0) {
  if (validateConfig()) {
    try {
      app = initializeApp(firebaseConfig)
      if (typeof window !== 'undefined') {
        console.log('✅ Firebase initialized successfully')
      }
    } catch (error) {
      console.error('❌ Firebase initialization error:', error)
      throw error
    }
  } else {
    // Create a dummy app to prevent errors
    app = initializeApp({
      apiKey: 'dummy',
      authDomain: 'dummy',
      projectId: 'dummy',
      storageBucket: 'dummy',
      messagingSenderId: 'dummy',
      appId: 'dummy',
    })
  }
} else {
  app = getApps()[0]
}

// Initialize Firebase services
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)

export default app

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  return validateConfig()
}

