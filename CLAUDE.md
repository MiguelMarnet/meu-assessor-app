# Este é o app — e este repositório é PÚBLICO

Assessor.IA. É daqui que o GitHub Pages serve o que as pessoas usam:
`https://miguelmarnet.github.io/meu-assessor-app/`

**Público significa que qualquer pessoa lê tudo que for commitado aqui.**
Nunca escreva chave, token ou segredo neste repositório — nem em `config.json`,
nem em comentário, nem "temporariamente". Já houve um token compartilhado
publicado aqui por meses (inerte, mas exposto).

## Onde as coisas ficam

| | |
|---|---|
| O painel (as 9 telas + as camadas) | `painel/` |
| Entrada, cadastro, retorno do Google | `*.html` na raiz |
| Identidade visual | `paleta-sereno.css` |
| Endereços dos webhooks | `config.json` |

O backend — banco, n8n, SQL, documentação — vive no repositório **privado**
`C:\Users\Admin\Documents\Meu-Assessor`. Não traga arquivo de lá para cá, nem
daqui para lá: nenhum nome de arquivo deve existir nos dois.

Existe uma pasta `Meu-Assessor/experience-v4/` (agora em `_historico/`) que
**não é o app**, apesar de ter os mesmos nomes de arquivo. Duas correções já se
perderam por causa disso. Se for editar uma tela, é aqui, em `painel/`.

## Depois de editar, prove

```
node ../Meu-Assessor/verificar-publicado.cjs
```

Commit não é deploy. Uma correção de segurança do Financeiro já foi commitada,
revisada e dada como pronta enquanto o bug seguia vivo para os usuários.

## O contrato entre as telas

Cada tela guarda o seu no `localStorage` com prefixo `ma1:` e **não lê o Store
de outra**. A comunicação passa por três lugares, e só:

1. A tabela `events` (`task_done`, `meal`, `workout`, `focus`, `goal`,
   `milestone`, `spiritual`).
2. A tabela `painel_estado`, escrita por `painel/espelho.js`, que espelha as
   chaves duráveis. Para uma chave sua viajar entre aparelhos, ela entra nessa
   lista — não escreva no banco por fora.
3. As funções RPC do Supabase.

## Regras de produto

- **Nada apaga dado de quem usa.** Aditivo, reversível, com ponto de
  restauração.
- **Nunca invente número.** Se o dado não existe, mostre "—" e diga que não
  sabe. `numeros.js` e `briefing.js` já fazem isso — não regrida.
- **Dado de exemplo nunca vai para o banco** e nunca aparece para quem entrou
  na própria conta. Linhas de demonstração levam a marca `_demo` e a etiqueta
  EXEMPLO. Isso já foi um bug real: uma transação inventada virou dado
  permanente na conta de quem logou.
- **Todo texto de usuário é escapado** antes de ir para a tela. O XSS do
  financeiro, das notas e do simulador já foi fechado uma vez.
