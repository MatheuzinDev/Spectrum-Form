/**
 * Convenção da seção 15. O `scope-enum` é fechado e derivado da estrutura da
 * seção 5.2: escopo livre aceita qualquer coisa, e em duas semanas o histórico
 * tem `feat(fix)`, `feat(api)` e `feat(backend)` convivendo como se fossem
 * coisas diferentes.
 *
 * Este gancho é a última trava real da convenção: desde a seção 18.1 não há
 * pull request, e o job `commits` do CI só reporta depois que o commit já está
 * na `main`.
 */
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
    // O emoji vem depois dos dois-pontos (`feat(api): ✨ ...`), então o assunto
    // começa com um caractere que as regras de caixa não sabem classificar.
    'subject-case': [0],
  },
};
