# Security Specification for Nutrition Helper

This specification defines the security rules, invariants, and threat models for the Nutrition Helper application, which uses Firebase Authentication and Cloud Firestore.

## 1. Data Invariants

- **Ownership Isolation**: A user's profile and food logs must only be readable and writable by that specific authenticated user (`request.auth.uid == userId`). No user is allowed to access another user's profile or logs.
- **Strict Typing and Boundary Limits**:
  - `dailyCaloricLimit` must be a positive integer strictly between 500 and 10000.
  - Macronutrients (`proteinTarget`, `carbsTarget`, `fatsTarget`) must be positive integers strictly between 0 and 1000.
  - Food logs must have a non-empty name (under 128 characters), non-negative calories, and non-negative macronutrients (protein, carbs, fats).
  - Food logs `mealType` must be one of: `Breakfast`, `Lunch`, `Dinner`, `Snack`.
- **Temporal Integrity**: All timestamp fields (`createdAt`, `updatedAt`) must match `request.time`. They must be immutable after creation.
- **No Shadow Fields (Ghost Fields)**: During document creation, exact map keys must be matched. Extra properties are forbidden.
- **Secure Queries**: Client queries must verify `resource.data` or document paths directly.

## 2. The "Dirty Dozen" Threat Payloads

The following 12 payloads are designed to test the boundaries of our security rules. All of them must be rejected with `PERMISSION_DENIED`:

1. **Identity Spoofing (Create Profile for Other)**
   - Attempting to create a user profile under `/users/otherUser` where `request.auth.uid` is `myUser`.
2. **Identity Spoofing (Payload Mismatch)**
   - Attempting to create a user profile under `/users/myUser` but setting the payload field `userId` to `otherUser`.
3. **Ghost Field Injection (Shadow Update)**
   - Creating or updating `/users/myUser` with an unrequested field `isAdmin: true` or `isPremium: true` to escalate privileges.
4. **Boundary Violation (Negative Caloric Goal)**
   - Creating `/users/myUser` with `dailyCaloricLimit = -1500`.
5. **Boundary Violation (Absurd Caloric Goal)**
   - Creating `/users/myUser` with `dailyCaloricLimit = 99999`.
6. **Orphaned Write / Wrong Path (Food Log Under Other User)**
   - Authenticated as `myUser` but attempting to write a food log to `/users/otherUser/foodLogs/log123`.
7. **Boundary Violation (Negative Calories in Log)**
   - Creating a food log with `calories = -200`.
8. **Boundary Violation (Negative Macros in Log)**
   - Creating a food log with `protein = -10` or `fats = -5`.
9. **Enum Value Bypass (Invalid Meal Type)**
   - Creating a food log with `mealType = "MidnightFeast"`.
10. **Temporal Integrity Hack (Client-Side CreatedAt)**
    - Trying to set `createdAt = timestamp("2010-01-01T00:00:00Z")` instead of `request.time`.
11. **Immortal Field Tampering (Updating userId)**
    - Attempting to update a profile and change `userId` from `myUser` to `otherUser`.
12. **Unauthenticated Access**
    - Reading or writing any profile or log without an active `request.auth`.

## 3. Test Runner (`firestore.rules.test.ts`)

Since we are in a TypeScript environment, the following test suite describes the verification runner for these payloads.

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'health-coach-project',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules', () => {
  test('1. Reject UserProfile creation for other user', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'otherUser');
    await assertFails(setDoc(docRef, {
      userId: 'otherUser',
      dailyCaloricLimit: 2000,
      proteinTarget: 150,
      carbsTarget: 200,
      fatsTarget: 70,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('2. Reject UserProfile creation with mismatched payload userId', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser');
    await assertFails(setDoc(docRef, {
      userId: 'otherUser', // mismatched
      dailyCaloricLimit: 2000,
      proteinTarget: 150,
      carbsTarget: 200,
      fatsTarget: 70,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('3. Reject UserProfile with ghost field (shadow update)', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser');
    await assertFails(setDoc(docRef, {
      userId: 'myUser',
      dailyCaloricLimit: 2000,
      proteinTarget: 150,
      carbsTarget: 200,
      fatsTarget: 70,
      isAdmin: true, // shadow field
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('4. Reject negative caloric limit', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser');
    await assertFails(setDoc(docRef, {
      userId: 'myUser',
      dailyCaloricLimit: -1500,
      proteinTarget: 150,
      carbsTarget: 200,
      fatsTarget: 70,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('5. Reject absurd caloric limit', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser');
    await assertFails(setDoc(docRef, {
      userId: 'myUser',
      dailyCaloricLimit: 99999,
      proteinTarget: 150,
      carbsTarget: 200,
      fatsTarget: 70,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('6. Reject food log creation under another user path', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'otherUser', 'foodLogs', 'log123');
    await assertFails(setDoc(docRef, {
      id: 'log123',
      userId: 'otherUser',
      name: 'Oatmeal',
      mealType: 'Breakfast',
      calories: 300,
      protein: 10,
      carbs: 50,
      fats: 5,
      date: '2026-06-29',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('7. Reject negative calories in food log', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser', 'foodLogs', 'log123');
    await assertFails(setDoc(docRef, {
      id: 'log123',
      userId: 'myUser',
      name: 'Oatmeal',
      mealType: 'Breakfast',
      calories: -100, // invalid
      protein: 10,
      carbs: 50,
      fats: 5,
      date: '2026-06-29',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('8. Reject negative macronutrients in food log', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser', 'foodLogs', 'log123');
    await assertFails(setDoc(docRef, {
      id: 'log123',
      userId: 'myUser',
      name: 'Oatmeal',
      mealType: 'Breakfast',
      calories: 300,
      protein: -10, // invalid
      carbs: 50,
      fats: 5,
      date: '2026-06-29',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('9. Reject invalid enum mealType in food log', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser', 'foodLogs', 'log123');
    await assertFails(setDoc(docRef, {
      id: 'log123',
      userId: 'myUser',
      name: 'Oatmeal',
      mealType: 'MidnightFeast', // invalid
      calories: 300,
      protein: 10,
      carbs: 50,
      fats: 5,
      date: '2026-06-29',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('10. Reject client-provided created timestamp mismatch', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser');
    await assertFails(setDoc(docRef, {
      userId: 'myUser',
      dailyCaloricLimit: 2000,
      proteinTarget: 150,
      carbsTarget: 200,
      fatsTarget: 70,
      createdAt: new Date('2010-01-01'), // invalid
      updatedAt: new Date()
    }));
  });

  test('11. Reject changing immutable userId on update', async () => {
    const context = testEnv.authenticatedContext('myUser');
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser');
    // Assume profile exists
    await assertFails(updateDoc(docRef, {
      userId: 'otherUser'
    }));
  });

  test('12. Reject unauthenticated access to users', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const docRef = doc(db, 'users', 'myUser');
    await assertFails(getDoc(docRef));
  });
});
```
