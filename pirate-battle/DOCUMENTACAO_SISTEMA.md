# Documentação Técnica: Funcionamento, Arquitetura, SOLID e Clean Code

Este documento apresenta uma análise técnica aprofundada do projeto **Pirate Battle**, detalhando seu funcionamento ponta a ponta e avaliando a aplicação dos princípios **SOLID** e das práticas de **Clean Code**.

---

## 1. Visão Geral e Arquitetura do Sistema

O projeto adota uma arquitetura híbrida de alto desempenho que separa rigidamente a **simulação do jogo (PixiJS)** da **interface declarativa (React)** e da **camada de dados (TanStack Query + MSW)**:

```
┌────────────────────────────────────────────────────────┐
│                   React Layer (UI / HUD)               │
│  - Telas (Menu, Partida, Resultados, Opções)           │
│  - GameHUD reativo (Placar, Tempo, Barra de Vida)      │
│  - React Query (Cache de Leaderboard e Match History)  │
└──────────────────────────▲─────────────────────────────┘
                           │ (Observer / EventEmitter)
┌──────────────────────────▼─────────────────────────────┐
│                 PixiJS GameEngine (Core)               │
│  - Game Loop determinístico baseado em Delta Time (dt) │
│  - Gerenciador de Inputs (Teclado + Touch)             │
│  - Árvore de Display em Camadas (Layers Containers)    │
│  - Entidades: PlayerShip, Inimigos (Chaser, Shooter)   │
│  - Projéteis, Ilhas e Sistema de Colisão Circular      │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTP REST / Mock Service Worker)
┌──────────────────────────▼─────────────────────────────┐
│             Network & Persistence (API Layer)          │
│  - Axios Client + MSW Interceptor                      │
│  - Fila de sincronização Offline-First (localStorage)  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Como o Código Funciona (Ponta a Ponta)

### 2.1. Inicialização e Ciclo de Vida
1. **Montagem do Componente (`App.tsx` & `GameCanvas.tsx`)**:
   - Quando o jogador clica em "Iniciar Jogo", o componente `GameCanvas` inicializa a aplicação PixiJS (`new Application()`).
   - O `GameEngine` é instanciado recebendo a aplicação PixiJS e a configuração (`GameConfig`).
   - O `AssetLoader` carrega os assets gráficos de forma assíncrona (incluindo a matriz 3x3 das ilhas, mar profundo e águas rasas) com tratamento de fallback.
2. **Camadas de Renderização (`Containers`)**:
   - Para garantir a correta ordem de sobreposição (*z-ordering*), o `GameEngine` organiza o palco (`stage`) em 5 containers hierárquicos:
     1. `backgroundLayer` (ladrilhos de mar profundo `waterTile` e águas rasas `shallowWaterTile` contornando as ilhas)
     2. `islandLayer` (3 ilhas táticas montadas em matriz de 3x3 tiles intransponíveis)
     3. `entityLayer` (navio do jogador, navios inimigos e projéteis)
     4. `effectLayer` (partículas e animações de explosão)
     5. `uiLayer` (elementos visuais de interface sobre a arena)

### 2.2. Game Loop com Delta Time (dt)
- O loop principal é acionado pelo `app.ticker.add(...)` da PixiJS.
- O tempo decorrido entre frames é normalizado em segundos: `const dt = ticker.deltaMS / 1000;`.
- **Independência de Taxa de Quadros**: Toda velocidade de movimentação, velocidade de projéteis, taxas de rotação e timers de recarga (*cooldowns*) são multiplicados por `dt`. Isso garante que o jogo funcione na mesma velocidade em telas de 60Hz, 120Hz ou 144Hz.

### 2.3. Controles e Entidades
- **`InputManager`**: Escuta eventos de teclado (`keydown`, `keyup`) e botões touch da tela, mantendo um estado imutável `InputState` (`forward`, `rotateLeft`, `rotateRight`, `firePrimary`, `fireSideLeft`, `fireSideRight`).
- **`PlayerShip`**:
  - Movimento longitudinal (`x += cos(rotation) * speed * dt`, `y += sin(rotation) * speed * dt`).
  - Disparo Frontal: canhão único central com baixo cooldown.
  - Disparo Lateral (Bordada): 3 projéteis paralelos disparados perpendicularmente à rotação do navio (`-Math.PI / 2` e `Math.PI / 2`).
  - Feedback visual dinâmico: barra de vida sobre o navio e redução gradual da opacidade (`alpha`) conforme recebe dano.
- **Inimigos (`ChaserEnemy` & `ShooterEnemy`)**:
  - `ChaserEnemy`: calcula o vetor em direção ao jogador (`Math.atan2(dy, dx)`), rotaciona suavemente e avança. Ao colidir com o jogador, causa dano massivo por impacto suicida.
  - `ShooterEnemy`: persegue o jogador até entrar no raio de ataque (`shooterAttackRange`), para de se aproximar e dispara canhões frontais periodicamente.

### 2.4. Colisões e Física (`CollisionSystem.ts`)
- Utiliza **detecção de colisão circular (Circle-to-Circle)**:
  $$\text{distância}^2 = (x_1 - x_2)^2 + (y_1 - y_2)^2 \le (r_1 + r_2)^2$$
- Evita o cálculo custoso de raiz quadrada (`Math.sqrt`), comparando o quadrado da distância com o quadrado da soma dos raios.
- Trata colisões entre:
  - Jogador $\leftrightarrow$ Ilhas (bloqueio de movimentação).
  - Inimigos $\leftrightarrow$ Ilhas (bloqueio de movimentação).
  - Projéteis $\leftrightarrow$ Ilhas (projétil é destruído e gera efeito de impacto).
  - Projéteis do Jogador $\leftrightarrow$ Inimigos (dano no inimigo, contabilização de pontuação se destruído).
  - Projéteis dos Inimigos / Inimigo Suicida $\leftrightarrow$ Jogador (dano no jogador).

### 2.5. Integração Reativa com React (Desacoplamento de 60 FPS)
- Em vez do React atualizar o DOM a cada frame do jogo, o `GameEngine` usa o padrão **Observer (`EventEmitter`)**.
- O React apenas escuta eventos discretos relevantes para a UI:
  - `score:update`: atualiza a pontuação exibida no HUD.
  - `time:update`: atualiza o cronômetro somente quando o segundo inteiro muda.
  - `player:health`: atualiza a barra de vida da interface somente quando há variação no HP.
  - `game:over`: dispara a transição para a tela de resultados e a submissão da partida.

### 2.6. Camada de Rede, Persistência e Resiliência Offline
- Ao término da partida (`game:over`), um registro `MatchRecord` é criado com UUID único, pontuação, tempo e snapshot das configurações.
- **Idempotência**: A API (simulada via MSW) aceita submissões com chaves idempotentes, evitando duplicação de pontuações.
- **Fila Offline**: Se a requisição falhar (falta de internet ou erro de rede), o `matchService` salva a partida no `localStorage` em uma fila de pendências (`pirate_battle_pending_matches`) e permite sincronização posterior.

---

## 3. Avaliação dos Princípios SOLID

| Princípio | Aplicação no Projeto | Veredito |
| :--- | :--- | :---: |
| **S** — Single Responsibility Principle | Cada módulo tem um propósito único e bem definido (`InputManager`, `AssetLoader`, `EffectManager`, `CollisionSystem`, `matchService`). | **Excelente** |
| **O** — Open/Closed Principle | Estrutura aberta para extensão (novas entidades implementando a interface `Entity`/`Enemy`, novo listeners no `EventEmitter`) sem necessidade de modificar a lógica existente. | **Excelente** |
| **L** — Liskov Substitution Principle | `ChaserEnemy` e `ShooterEnemy` implementam `Enemy` e podem ser operados de forma polimórfica pela engine. | **Muito Bom** |
| **I** — Interface Segregation Principle | Interfaces coesas e enxutas (`Entity`, `Position`, `InputState`, `GameConfig`), sem contratos sobrecarregados. | **Excelente** |
| **D** — Dependency Inversion Principle | O `GameEngine` recebe configurações (`GameConfig`) e instâncias externas, desacoplando-se de valores fixos (*hardcoded*) e da UI do React. | **Excelente** |

### Detalhamento por Princípio:

1. **Single Responsibility Principle (SRP)**:
   - `CollisionSystem.ts`: Contém apenas funções matemáticas puras de detecção e contenção (`checkCircleCollision`, `clamp`), sem referências a sprites ou renderizadores.
   - `InputManager.ts`: Dedicado exclusivamente a capturar eventos de entrada e normalizá-los em um `InputState`.
   - `EffectManager.ts`: Gerencia exclusivamente o ciclo de vida e animação de partículas e efeitos de explosão.
   - `matchService.ts`: Centraliza as chamadas de API e a gestão de cache/fila offline no `localStorage`.

2. **Open/Closed Principle (OCP)**:
   - A criação de um novo tipo de inimigo (ex: `BossShip` ou `KamikazeBoat`) exige apenas criar uma nova classe que implemente a interface `Enemy` e conectá-la ao método de spawn, sem alterar o loop principal de física ou as outras classes de inimigos.

3. **Liskov Substitution Principle (LSP)**:
   - As coleções de entidades (`Enemy[]`, `Projectile[]`) são tratadas uniformemente pelo loop de atualização e remoção.
   - *Ponto de atenção*: Em `GameEngine.ts:252`, há uma checagem de tipo `enemy.type === 'chaser'` para o cálculo de colisão suicida com o player. Embora prático para o escopo do jogo, pode ser refatorado para um método abstrato `onPlayerCollision(player: PlayerShip)` no contrato `Enemy`, eliminando qualquer necessidade de `type checking`.

4. **Interface Segregation Principle (ISP)**:
   - A interface base `Entity` define apenas o essencial para a arena (`id, x, y, rotation, radius, isDead, update, destroy`).
   - A interface `Enemy` estende `Entity` com métodos específicos de combate (`takeDamage, updateAI, health, maxHealth`), sem forçar entidades estáticas (como `Island`) a implementarem métodos de IA ou dano.

5. **Dependency Inversion Principle (DIP)**:
   - O `GameEngine` e as entidades dependem da interface `GameConfig` injetada no construtor. Isso permite rodar a engine com diferentes regras, tempos de partida ou velocidades sem alterar nenhuma linha da lógica interna.

---

## 4. Avaliação de Clean Code

### 4.1. Pontos Fortes em Clean Code
- **Nomenclatura Clara e Significativa**:
  - Nomes de classes e métodos revelam intenção imediata (`takeDamage`, `fireBroadside`, `updateWithInput`, `syncPendingMatches`, `isDead`, `timeRemaining`).
- **Funções Pequenas e com Nível Único de Abstração**:
  - Métodos como `fireBroadside`, `updateHealthBar` e `createIslands` são curtos, legíveis e focados em um único objetivo.
- **Separação Limpa de Camadas**:
  - A camada de renderização e física não contém código JSX, hooks de React ou dependências do DOM.
  - A camada de UI em React não manipula diretamente o `ticker` ou coordenadas de renderização do PixiJS.
- **Tratamento Seguro de Erros e Resiliência**:
  - `AssetLoader` e inicializadores de sprites contêm blocos `try/catch` com desenho vetorial alternativo (`Graphics`), garantindo que o jogo permaneça jogável mesmo se os arquivos de imagem falharem no carregamento.
- **DRY (Don't Repeat Yourself)**:
  - As operações de colisão, rotação com suavização angular e limitação de borda (`clamp`) são centralizadas e reutilizadas em todas as entidades.
- **Tipagem Forte**:
  - Tipagem estrita com TypeScript, eliminando o uso de `any` nas estruturas centrais do domínio de jogo.

---

## 5. Resumo e Conclusão

O projeto **Pirate Battle** apresenta uma implementação de alto padrão técnico:
- **SOLID**: Amplamente aplicado, com excelente separação de responsabilidades, contratos bem segregados e baixo acoplamento via injeção de dependências e eventos.
- **Clean Code**: O código é limpo, legível, fortemente tipado, com funções de escopo delimitado, tratamento robusto de erros e arquitetura reativa livre de gargalos de desempenho.
