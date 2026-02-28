export function mockAuthResolved(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user_test',
    orgId: 'org_test',
    sessionClaims: { metadata: {} },
    ...overrides,
  };
}

export function mockAdminAuth() {
  return mockAuthResolved({ sessionClaims: { metadata: { role: 'admin' } } });
}

export function mockUnauthenticated() {
  return mockAuthResolved({ userId: null, orgId: null, sessionClaims: null });
}
