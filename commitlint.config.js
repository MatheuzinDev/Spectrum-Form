export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'repo',
        'shared',
        'api',
        'web',
        'colors',
        'clients',
        'auth',
        'health',
        'cache',
        'infra',
        'proxy',
        'ci',
        'docs',
        'deps',
      ],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [0],
  },
};
