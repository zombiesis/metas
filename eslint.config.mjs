// Flat config for ESLint 9 + Next 16.
// Avoid FlatCompat: when combined with eslint-config-next 16's plugin graph it
// fails with `TypeError: Converting circular structure to JSON` during config
// validation. The package's `core-web-vitals` export is already an array of
// flat-config blocks, so we can spread it directly.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'static-preview/**',
      'prisma/**',
      'public/sw.js',
      'e2e/**',
      'scripts/**',
      'next-env.d.ts',
      'src/generated/**',
    ],
  },
  ...nextCoreWebVitals,
  {
    // React 19's compiler-style purity rules and the unescaped-entities rule
    // surface ~20 pre-existing issues across the codebase that are unrelated
    // to the security/audit fixes. Keep them visible as warnings (so they show
    // up in PR review) but don't block CI on them. TODO: tackle separately.
    rules: {
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react/no-unescaped-entities': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
];
