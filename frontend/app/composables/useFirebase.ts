/**
 * Firebase SDK v9+ 統合Composable
 * 開発・本番環境対応・マルチテナント対応
 */
import { 
  getAuth, 
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth
} from 'firebase/auth'
import { 
  getFirestore, 
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  type Firestore,
  type DocumentData,
  type QueryConstraint
} from 'firebase/firestore'
import { 
  getStorage, 
  connectStorageEmulator,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type StorageReference,
  type UploadResult
} from 'firebase/storage'
import { 
  getAnalytics,
  logEvent,
  type Analytics
} from 'firebase/analytics'

// Firebase Environment Configuration
interface FirebaseEnvironment {
  name: 'development' | 'staging' | 'production'
  config: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
    measurementId?: string
  }
  emulator?: {
    auth: { host: string; port: number }
    firestore: { host: string; port: number }
    storage: { host: string; port: number }
  }
}

// Multi-tenant Support
interface TenantConfig {
  tenantId: string
  name: string
  settings: {
    theme: string
    features: string[]
    locale: string
  }
}

export const useFirebase = () => {
  const config = useRuntimeConfig()
  const router = useRouter()
  
  // State Management
  const currentUser = ref<User | null>(null)
  const isAuthenticated = computed(() => !!currentUser.value)
  const currentTenant = ref<TenantConfig | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  
  // Firebase Services
  let auth: Auth
  let firestore: Firestore
  let storage: any
  let analytics: Analytics
  
  // Environment Detection
  const getCurrentEnvironment = (): FirebaseEnvironment['name'] => {
    if (process.env.NODE_ENV === 'production') {
      return 'production'
    }
    if (process.env.NODE_ENV === 'staging') {
      return 'staging'
    }
    return 'development'
  }
  
  // Firebase Configuration
  const getFirebaseConfig = (): FirebaseEnvironment => {
    const env = getCurrentEnvironment()
    const publicConfig = config.public.firebaseConfig
    
    const baseConfig: FirebaseEnvironment = {
      name: env,
      config: {
        apiKey: publicConfig.apiKey,
        authDomain: publicConfig.authDomain,
        projectId: publicConfig.projectId,
        storageBucket: publicConfig.storageBucket,
        messagingSenderId: publicConfig.messagingSenderId,
        appId: publicConfig.appId,
        measurementId: publicConfig.measurementId
      }
    }
    
    // Development environment with emulator support
    if (env === 'development') {
      baseConfig.emulator = {
        auth: { host: '127.0.0.1', port: 9099 },
        firestore: { host: '127.0.0.1', port: 8080 },
        storage: { host: '127.0.0.1', port: 9199 }
      }
    }
    
    return baseConfig
  }
  
  // Initialize Firebase Services - VueFire統合版（競合解消）
  const initializeFirebase = async () => {
    try {
      // ✅ VueFire composables使用（競合回避）
      const { $firebaseApp } = useNuxtApp()
      
      if (!$firebaseApp) {
        throw new Error('Firebase app not available from VueFire')
      }
      
      // ✅ VueFire管理のインスタンス使用（重複初期化回避）
      auth = getAuth($firebaseApp)
      firestore = getFirestore($firebaseApp)
      storage = getStorage($firebaseApp)
      
      // Analytics初期化（クライアントのみ）
      const environment = getFirebaseConfig()
      if (process.client && environment.config.measurementId) {
        analytics = getAnalytics($firebaseApp)
      }
      
      // ❌ Emulator接続を無効化（VueFireが管理）
      // VueFire がemulator設定を管理するため、手動接続は不要
      
      // Setup auth state listener
      setupAuthStateListener()
      
      console.log('🔥 Firebase services initialized via VueFire')
      
    } catch (error: any) {
      console.error('Firebase VueFire integration error:', error)
      throw new Error(`Firebase VueFire integration failed: ${error.message}`)
    }
  }
  
  // Authentication State Management
  const setupAuthStateListener = () => {
    onAuthStateChanged(auth, async (user) => {
      currentUser.value = user
      isLoading.value = false
      
      if (user) {
        console.log('🔐 User authenticated:', user.uid)
        
        // Load user tenant information
        await loadUserTenant(user.uid)
        
        // Analytics tracking
        if (analytics) {
          logEvent(analytics, 'login', {
            method: user.providerData[0]?.providerId || 'unknown'
          })
        }
      } else {
        console.log('🔐 User signed out')
        currentTenant.value = null
      }
    })
  }
  
  // Multi-tenant Support
  const loadUserTenant = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const tenantId = userData.tenantId
        
        if (tenantId) {
          const tenantDoc = await getDoc(doc(firestore, 'tenants', tenantId))
          
          if (tenantDoc.exists()) {
            currentTenant.value = {
              tenantId,
              ...tenantDoc.data()
            } as TenantConfig
            
            console.log('🏢 Tenant loaded:', tenantId)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user tenant:', error)
    }
  }
  
  // Authentication Methods
  const signInWithEmail = async (email: string, password: string) => {
    try {
      error.value = null
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      if (analytics) {
        logEvent(analytics, 'login', { method: 'email' })
      }
      
      return result.user
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  const signUpWithEmail = async (email: string, password: string, userData?: any) => {
    try {
      error.value = null
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Create user document
      if (userData) {
        await setDoc(doc(firestore, 'users', result.user.uid), {
          email,
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      
      if (analytics) {
        logEvent(analytics, 'sign_up', { method: 'email' })
      }
      
      return result.user
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  const signInWithGoogle = async () => {
    try {
      error.value = null
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      // Create or update user document
      const userRef = doc(firestore, 'users', result.user.uid)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          provider: 'google',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      
      if (analytics) {
        logEvent(analytics, 'login', { method: 'google' })
      }
      
      return result.user
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  const logout = async () => {
    try {
      await signOut(auth)
      currentTenant.value = null
      await router.push('/login')
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  // Firestore Operations
  const createDocument = async (collectionName: string, documentData: any, documentId?: string) => {
    try {
      // Add tenant context if available
      if (currentTenant.value) {
        documentData.tenantId = currentTenant.value.tenantId
      }
      
      documentData.createdAt = new Date()
      documentData.updatedAt = new Date()
      
      if (documentId) {
        await setDoc(doc(firestore, collectionName, documentId), documentData)
        return documentId
      } else {
        const docRef = await addDoc(collection(firestore, collectionName), documentData)
        return docRef.id
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  const updateDocument = async (collectionName: string, documentId: string, updateData: any) => {
    try {
      updateData.updatedAt = new Date()
      await updateDoc(doc(firestore, collectionName, documentId), updateData)
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  const deleteDocument = async (collectionName: string, documentId: string) => {
    try {
      await deleteDoc(doc(firestore, collectionName, documentId))
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  const getDocument = async (collectionName: string, documentId: string) => {
    try {
      const docRef = doc(firestore, collectionName, documentId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  // Real-time Query with Multi-tenant Support
  const useFirestoreQuery = (collectionName: string, constraints: QueryConstraint[] = []) => {
    const data = ref<DocumentData[]>([])
    const loading = ref(true)
    const queryError = ref<string | null>(null)
    
    const unsubscribe = ref<(() => void) | null>(null)
    
    const setupQuery = () => {
      try {
        let queryConstraints = [...constraints]
        
        // Add tenant filter if available
        if (currentTenant.value) {
          queryConstraints.unshift(where('tenantId', '==', currentTenant.value.tenantId))
        }
        
        const q = query(collection(firestore, collectionName), ...queryConstraints)
        
        unsubscribe.value = onSnapshot(q, (snapshot) => {
          data.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          loading.value = false
          queryError.value = null
        }, (err) => {
          queryError.value = err.message
          loading.value = false
        })
        
      } catch (err: any) {
        queryError.value = err.message
        loading.value = false
      }
    }
    
    // Setup query when tenant is loaded
    watch(currentTenant, () => {
      if (unsubscribe.value) {
        unsubscribe.value()
      }
      setupQuery()
    }, { immediate: true })
    
    onUnmounted(() => {
      if (unsubscribe.value) {
        unsubscribe.value()
      }
    })
    
    return {
      data: readonly(data),
      loading: readonly(loading),
      error: readonly(queryError)
    }
  }
  
  // Storage Operations
  const uploadFile = async (filePath: string, file: File, metadata?: any): Promise<string> => {
    try {
      // Add tenant context to file path
      if (currentTenant.value) {
        filePath = `tenants/${currentTenant.value.tenantId}/${filePath}`
      }
      
      const fileRef = storageRef(storage, filePath)
      const uploadResult: UploadResult = await uploadBytes(fileRef, file, metadata)
      const downloadURL = await getDownloadURL(uploadResult.ref)
      
      return downloadURL
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  const deleteFile = async (filePath: string) => {
    try {
      if (currentTenant.value) {
        filePath = `tenants/${currentTenant.value.tenantId}/${filePath}`
      }
      
      const fileRef = storageRef(storage, filePath)
      await deleteObject(fileRef)
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }
  
  // Initialize on component mount
  onMounted(async () => {
    try {
      await initializeFirebase()
    } catch (err: any) {
      error.value = `Firebase initialization failed: ${err.message}`
      isLoading.value = false
    }
  })
  
  return {
    // State
    currentUser: readonly(currentUser),
    isAuthenticated,
    currentTenant: readonly(currentTenant),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Authentication
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    
    // Firestore
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    useFirestoreQuery,
    
    // Storage
    uploadFile,
    deleteFile,
    
    // Utilities
    getCurrentEnvironment,
    getFirebaseConfig
  }
}