# ⚠️ Armadilhas Conhecidas & Lições Aprendidas (Gotchas)

## 1. PowerShell Scripting vs `&&`
- **Problema:** Em PowerShell no Windows, o operador `&&` causa erro sintático (`O token '&&' não é um separador de instruções válido nesta versão`).
- **Solução:** Utilizar `;` para encadear comandos ou executar scripts via arquivos `.cjs` / `cmd.exe /c`.

## 2. ESM e Execução de Scripts Utilitários
- **Problema:** O projeto está configurado com `"type": "module"` no `package.json`. Scripts com extensão `.js` executando `require(...)` falham com `ReferenceError: require is not defined in ES module scope`.
- **Solução:** Nomear scripts utilitários como `.cjs` ou usar `import ... from ...` com `.mjs` ou `.js`.

## 3. GitHub Actions `npm ci` e `package-lock.json`
- **Problema:** Se a versão em `package.json` for alterada sem sincronizar o `package-lock.json`, o runner do GitHub Actions pode falhar ou divergir.
- **Solução:** Sempre rodar `npm i --package-lock-only` antes de criar tags de release.

## 4. Disparo de GitHub Releases Obrigatório via Tag
- **Problema:** Dar `git push origin main` não dispara o workflow `.github/workflows/release.yml`. Usuários e o in-app updater não encontram o novo `.exe` no GitHub.
- **Solução:** Sempre criar a tag anotada correspondente (`git tag -a vX.Y.Z -m "..."`) e realizar `git push origin vX.Y.Z`.

## 5. Quebras de Linha em Scripts Injetados via Template Literals
- **Problema:** Injetar strings JS contendo `\n` dentro de template literals em Node.js avalia a sequência como um caractere de nova linha literal (`\x0A`), quebrando strings em aspas simples no browser (`SyntaxError: Invalid or unexpected token`). Isso impede o carregamento do `<script>` e quebra 100% dos botões `onclick`.
- **Solução:** Validar a integridade sintática do script gerado com `new vm.Script(...)` e testes unitários dedicados em `tests/ui-syntax-and-handlers.test.ts`.
