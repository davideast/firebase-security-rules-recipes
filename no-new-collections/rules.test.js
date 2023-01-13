import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import test from 'ava';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let testEnv = await initializeTestEnvironment({
  projectId: 'security-rules-recipes',
  firestore: {
    rules: readFileSync(`${__dirname}/firestore.rules`, 'utf8'),
    host: 'localhost',
    port: 8080,
  },
});

function assertPermissionDenied(t, result) {
  t.is(result.code, 'permission-denied');
}

test.before(async () => {
  testEnv.clearFirestore();
});

test.after(() => {
  testEnv.clearFirestore();
});

test('An unauthenticated user fails to write to a profile', async (t) => {
  const context = testEnv.unauthenticatedContext();
  const userDoc = context.firestore().doc('users/david_123');
  const result = await assertFails(userDoc.set({ name: 'Im david', email: 'blah@email.com' }));
  assertPermissionDenied(t, result);
});

// 2
test('An authenticated user can write to their profile', async (t) => {
  const context = testEnv.authenticatedContext('david_123');
  const userDoc = context.firestore().doc('users/david_123');
  const result = await assertSucceeds(userDoc.set({ name: 'Im david' }));
  t.is(result, undefined);
});

test('An authenticated user cannot create a new collection', async (t) => {
  const context = testEnv.unauthenticatedContext();
  const userDoc = context.firestore().doc('users2/david_123');
  const result = await assertFails(userDoc.set({ name: 'Im david', email: 'blah@email.com' }));
  assertPermissionDenied(t, result);
});
