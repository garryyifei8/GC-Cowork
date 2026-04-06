export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['frontend', 'backend', 'agents', 'infra', 'docs', 'workflow', 'db'],
    ],
    'scope-empty': [1, 'never'],
  },
};
