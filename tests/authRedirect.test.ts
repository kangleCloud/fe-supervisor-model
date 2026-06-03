import { buildLoginLocation, resolvePostLoginRedirect } from '@/router/authRedirect';

describe('authRedirect', () => {
  it('builds login redirect with the protected path', () => {
    expect(buildLoginLocation('/supervisor?host=10.0.0.1')).toEqual({
      path: '/login',
      query: {
        redirect: '/supervisor?host=10.0.0.1',
      },
    });
  });

  it('drops unsafe redirect targets', () => {
    expect(resolvePostLoginRedirect('https://evil.test')).toBe('/supervisor');
    expect(resolvePostLoginRedirect('//evil.test')).toBe('/supervisor');
    expect(resolvePostLoginRedirect('/supervisor')).toBe('/supervisor');
  });
});
