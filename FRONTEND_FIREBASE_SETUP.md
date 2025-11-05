# 🔥 Configuración de Firebase en Frontend

## ✅ Estado Actual

- ✅ Firebase SDK instalado (`firebase@^10.7.0`)
- ✅ Archivo de configuración creado (`lib/firebase.ts`)
- ✅ Supabase eliminado
- ⚠️ Variables de entorno necesitan configuración

---

## 📋 Configuración Requerida

### **1. Crear archivo `.env.local`**

En `GDE_FRONTEND/`, crea `.env.local` con:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAlKx-G4ZpPIqIyiEM4S6Ln0FWGPvNW2P4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gde-basededatos.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gde-basededatos
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gde-basededatos.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=317787063647
NEXT_PUBLIC_FIREBASE_APP_ID=1:317787063647:web:ec794b67be859b82d422ea
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-M7CQ5SV6M0

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### **2. Instalar dependencias**

```bash
cd GDE_FRONTEND
pnpm install
```

Esto instalará `firebase@^10.7.0` que ya está en `package.json`.

---

## ✅ Verificación

### **Verificar que Firebase esté configurado:**

Abre la consola del navegador y verifica:
- ✅ Debe aparecer: `✅ Firebase initialized successfully`
- ⚠️ Si aparece warning sobre configuración incompleta, verifica `.env.local`

### **Verificar en código:**

```typescript
import { isFirebaseConfigured } from '@/lib/firebase'

if (isFirebaseConfigured()) {
  console.log('✅ Firebase configurado correctamente')
} else {
  console.warn('⚠️ Firebase no está configurado')
}
```

---

## 📝 Notas Importantes

1. **El frontend sigue usando la API del backend** - No usa Firestore directamente
2. **Firebase Auth** está disponible pero no se usa actualmente (se usa JWT del backend)
3. **Firestore** está disponible para uso futuro si se necesita acceso directo
4. **Storage** está disponible para subida de archivos

---

## 🔄 Migración Completa (Opcional)

Si quieres usar Firebase Auth en lugar de JWT del backend:

1. Habilitar Firebase Authentication en Firebase Console
2. Actualizar `contexts/auth-context.tsx` para usar Firebase Auth
3. Actualizar `lib/api.ts` para usar tokens de Firebase

**Estado actual:** El frontend usa JWT del backend (no requiere cambios)

---

## ✅ Checklist

- [x] Firebase SDK agregado a `package.json`
- [x] Archivo `lib/firebase.ts` creado
- [x] Supabase eliminado
- [ ] Archivo `.env.local` creado con configuración
- [ ] Dependencias instaladas (`pnpm install`)
- [ ] Verificar inicialización en consola del navegador

---

**Última actualización:** 2025-11-04

