# 🏴‍☠️ Pirate Battle

Um jogo de batalha naval 2D desenvolvido com **React**, **TypeScript** e **PixiJS**, onde o jogador controla um navio pirata e navega enfrentando inimigos e desafiando chefões em alto-mar.

🔗 **Acesse e jogue online:** [https://pirate-battle-delta.vercel.app/](https://pirate-battle-delta.vercel.app/)

---

## 🚀 Tecnologias Utilizadas

- **React 19** - Biblioteca para interface do usuário
- **TypeScript** - Tipagem estática e segurança no código
- **PixiJS v8** - Motor de renderização 2D de alta performance via WebGL/Canvas
- **Vite** - Bundler e ambiente de desenvolvimento ultra-rápido
- **TanStack Query (React Query)** - Gerenciamento de estado de requisições
- **MSW (Mock Service Worker)** - Mocking de API no ambiente de desenvolvimento
- **Playwright** - Testes end-to-end (E2E)

---

## 🎮 Como Jogar

1. **Movimentação:** Utilize as teclas `W`, `A`, `S`, `D` ou as setas direcionais para movimentar o navio.
2. **Ataque:** Pressione `Espaço` para disparar os canhões na direção do movimento ou miras do navio.
3. **Objetivo:** Destrua os navios inimigos, desvie dos ataques e vença as ondas de inimigos para enfrentar o poderoso Chefão!

---

## 🛠️ Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js (versão 18+ recomendada)
- npm ou yarn

### Passo a passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/vitorgarcia-cloud/pirate-battle.git
   cd pirate-battle
   ```

2. **Instalar as dependências:**
   ```bash
   # Na raiz do projeto ou dentro da pasta pirate-battle
   cd pirate-battle
   npm install
   ```

3. **Executar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no seu navegador pelo endereço indicado no terminal (ex: `http://localhost:5173`).

---

## 🧪 Rodando os Testes E2E (Playwright)

Para executar a suíte de testes com Playwright:

```bash
# Na raiz do projeto
npm test
# ou para abrir o modo UI interativo do Playwright:
npx playwright test --ui
```

---

## 📦 Build para Produção

Para gerar a versão otimizada de produção:

```bash
cd pirate-battle
npm run build
```

---

## 📄 Licença

Este projeto é um projeto de demonstração e entrevista. Sinta-se à vontade para explorar o código fonte!
