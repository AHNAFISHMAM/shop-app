# TypeScript Errors Troubleshooting Guide

## 📋 Overview

Common TypeScript error patterns and their solutions. This guide helps you quickly identify and fix TypeScript errors in your project.

---

## 🔴 Common Error Types

### TS2322: Type Assignment Error

**Error Message:**
```
Type 'X' is not assignable to type 'Y'
```

**Common Causes:**
- Type mismatch between expected and actual types
- Missing type definitions
- Incorrect type assertions

**Solutions:**

1. **Add Type Assertion:**
```typescript
// Before
const value: string = someValue

// After
const value: string = someValue as string
```

2. **Add Type Guard:**
```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

if (isString(value)) {
  // value is now string
}
```

3. **Update Type Definition:**
```typescript
// Update the type to match actual usage
interface MyType {
  property: string | number // Allow both types
}
```

---

### TS2339: Property Does Not Exist

**Error Message:**
```
Property 'X' does not exist on type 'Y'
```

**Common Causes:**
- Property not defined in type
- Typo in property name
- Property is optional but accessed without check

**Solutions:**

1. **Add Property to Type:**
```typescript
interface MyType {
  newProperty: string // Add missing property
}
```

2. **Use Optional Chaining:**
```typescript
// Before
const value = obj.property

// After
const value = obj?.property
```

3. **Check Property Exists:**
```typescript
if ('property' in obj) {
  const value = obj.property
}
```

---

### TS2345: Argument Type Mismatch

**Error Message:**
```
Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Common Causes:**
- Function expects different type
- Missing required properties
- Type incompatibility

**Solutions:**

1. **Cast Argument:**
```typescript
// Before
myFunction(value)

// After
myFunction(value as ExpectedType)
```

2. **Transform Argument:**
```typescript
myFunction({
  ...value,
  requiredProperty: 'value',
})
```

3. **Update Function Signature:**
```typescript
// Update function to accept actual type
function myFunction(value: ActualType) {
  // ...
}
```

---

### TS18046: Unknown Type Error

**Error Message:**
```
'X' is of type 'unknown'
```

**Common Causes:**
- Error handling with unknown types
- API responses without types
- Event handlers with unknown types

**Solutions:**

1. **Type Guard (Real Example from buildfast-shop):**
```typescript
// From useCheckoutOrder.ts
try {
  await createOrder(/* ... */)
} catch (err: unknown) {
  logger.error('Error placing order:', err)
  
  let errorMessage = 'Failed to place order'
  if (err instanceof Error) {
    errorMessage = err.message
  } else if (typeof err === 'string') {
    errorMessage = err
  }
  
  handlePaymentError(new Error(errorMessage))
}
```

2. **Real-time Payload Handling:**
```typescript
// From useCheckoutRealtime.ts
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'addresses',
}, async (payload: unknown) => {
  const typedPayload = payload as {
    new?: Record<string, unknown>
    old?: Record<string, unknown>
  }
  
  logger.log('Address updated in checkout:', typedPayload)
  
  // Use typedPayload safely
  if (typedPayload.new && 'id' in typedPayload.new) {
    const addressId = typedPayload.new.id as string
    // Process address update
  }
})
```

2. **Type Assertion:**
```typescript
const typedValue = value as ExpectedType
```

3. **Type Narrowing:**
```typescript
if (typeof value === 'string') {
  // value is string here
}
```

---

### TS2532: Object Possibly Undefined

**Error Message:**
```
Object is possibly 'undefined'
```

**Common Causes:**
- Accessing property on potentially undefined object
- Array access without bounds check
- Optional property access

**Solutions:**

1. **Null Check:**
```typescript
if (obj) {
  const value = obj.property
}
```

2. **Optional Chaining:**
```typescript
const value = obj?.property
```

3. **Nullish Coalescing:**
```typescript
const value = obj?.property ?? defaultValue
```

---

### TS6133: Unused Variable

**Error Message:**
```
'X' is declared but its value is never read
```

**Common Causes:**
- Leftover code
- Unused parameters
- Unused imports

**Solutions:**

1. **Remove Unused Code:**
```typescript
// Remove if not needed
```

2. **Prefix with Underscore:**
```typescript
const _unusedVar = value // TypeScript ignores
```

3. **Use Variable:**
```typescript
// Actually use the variable
console.log(unusedVar)
```

---

### TS2769: No Overload Matches

**Error Message:**
```
No overload matches this call
```

**Common Causes:**
- Function signature mismatch
- Missing required parameters
- Type incompatibility in overloads

**Solutions:**

1. **Check Function Signature:**
```typescript
// Review function definition
function myFunction(param: Type): ReturnType {
  // ...
}
```

2. **Match Overload:**
```typescript
// Use correct overload
myFunction(param1, param2) // Match signature
```

3. **Update Overloads:**
```typescript
// Add or update overload definition
function myFunction(param: Type1): ReturnType1
function myFunction(param: Type2): ReturnType2
```

---

## 🛠️ General Troubleshooting Steps

### 1. Check TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true, // May be too strict
    "noUnusedLocals": true, // May flag unused vars
  }
}
```

### 2. Update Type Definitions

```bash
# Update @types packages
npm install --save-dev @types/node @types/react @types/react-dom
```

### 3. Clear TypeScript Cache

```bash
# Delete .tsbuildinfo
rm .tsbuildinfo

# Restart TypeScript server in IDE
```

### 4. Check Import Paths

```typescript
// Ensure imports are correct
import { MyType } from './types' // Check path
```

### 5. Use Type Assertions Carefully

```typescript
// Only use when you're certain
const value = unknownValue as KnownType

// Better: Use type guard
if (isKnownType(unknownValue)) {
  const value = unknownValue // Now typed
}
```

---

## 📚 Related Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Error Codes](https://typescript.tv/errors/)
- EvolveDoc: `master-prompts/MASTER_TYPE_SAFETY_MIGRATION_PROMPT.md`
- EvolveDoc: `master-prompts/MASTER_TYPESCRIPT_PATTERNS_PROMPT.md`

---

## 💡 Tips

1. **Read Error Messages**: TypeScript error messages are usually helpful
2. **Use Type Guards**: Prefer type guards over assertions
3. **Gradual Migration**: Enable strict mode gradually
4. **Type Definitions**: Keep type definitions up to date
5. **IDE Support**: Use TypeScript-aware IDEs for better error detection

---

**Last Updated:** 2025-01-27  
**Version:** 1.4.0

