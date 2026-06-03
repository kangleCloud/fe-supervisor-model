export function buildLoginLocation(fullPath?: string) {
  if (!fullPath || fullPath === '/login') {
    return { path: '/login' };
  }

  return {
    path: '/login',
    query: {
      redirect: fullPath,
    },
  };
}

export function resolvePostLoginRedirect(value: unknown) {
  if (typeof value !== 'string') {
    return '/supervisor';
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/supervisor';
  }

  return value;
}
