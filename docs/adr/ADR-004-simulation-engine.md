# ADR-004 — Motor de simulação único

- **Status:** aceito; motor implementado e testado (27/11/2026). Ainda não está ligado à interface: o primeiro uso será o simulador de falha de node (S2).
- **Data:** 27/11/2026
- **Contexto do plano:** `docs/IMPLEMENTATION_PLAN.md`, Fase 2 (S1) e, depois, S2, S4, S5, T1 e A1

## Contexto

A Fase 2 em diante pede simulações em que o tempo importa: falha de node (Lease a cada 10 s, NotReady após 50 s, despejo após 300 s), rede por pacote, autoscaling com janela de estabilização e incidentes guiados. Todas precisam das mesmas coisas: tocar, pausar, mudar a velocidade, avançar ou voltar um passo, pular para um instante e reiniciar. Fazer isso separado em cada simulador repetiria código e daria comportamentos diferentes para os mesmos botões.

## Decisão

Um motor só, em `js/sim/engine.js`, exposto como `window.K8SSIM` (script clássico, como o resto do site, conforme o [ADR-002](ADR-002-file-structure.md)).

1. **Definição declarativa:** `K8SSIM.create({ init, events, tick, dt, until, every })`.
   - `init`: estado inicial (objeto simples, copiável).
   - `events`: acontecimentos agendados `{ at, id, apply(state, t) }`, aplicados no instante exato e na ordem em que foram declarados quando caem no mesmo instante.
   - `tick(state, t)`: regra contínua aplicada a cada passo (ex.: renovar o Lease a cada 10 s).
   - `dt`: tamanho do passo, em segundos da simulação (padrão 1). `until`: fim.
2. **Tempo discreto e determinístico:** o tempo anda em passos inteiros de `dt`. O estado em `t = 0` é sempre `init`; um evento com `at: 0` vale a partir do primeiro passo.
3. **Sem relógio próprio:** quem usa chama `advance(ms)` com o tempo real decorrido (por exemplo, a partir do `requestAnimationFrame`). O motor converte esse tempo pela velocidade (0,5× a 10×) e acumula frações. Isso o deixa testável sem esperar tempo real.
4. **Voltar no tempo:** pontos de restauração a cada `every` passos (padrão 10). Para voltar, o motor restaura o ponto anterior e reaplica os passos. Como `apply` e `tick` são funções do estado, o resultado é exatamente o mesmo da primeira passagem, inclusive o histórico de eventos.
5. **Saída imutável:** `get()` e os ouvintes (`on`) recebem `{ t, tick, state, speed, playing, log, done }` congelado. A interface desenha a partir disso e não consegue alterar a simulação sem querer.
6. **Comandos:** `play`, `pause`, `toggle`, `setSpeed`, `stepForward`, `stepBack`, `seek(t)`, `restart`, `nextEventAt()` (para “pular para o próximo acontecimento”) e `events()` (para desenhar a linha do tempo).

## Verificação

`tests/unit/sim.test.mjs` (13 testes) usa um modelo de “node cai” com os tempos da lição `nodefail`:

- o relógio só anda tocando, na velocidade escolhida (1×, 10×, 0,5×), e acumula quadros de 16 ms;
- a velocidade fica entre 0,5× e 10×;
- os eventos disparam no instante exato e entram no histórico;
- voltar para qualquer instante (antes, depois e no meio de pontos de restauração) dá o mesmo estado e o mesmo histórico da primeira vez;
- passo a passo pausa; não vai antes de 0 nem depois do fim, e para sozinho no fim;
- o snapshot é imutável, e reiniciar volta ao estado inicial;
- mesma definição, mesma linha do tempo, qualquer que seja o ritmo de `advance`;
- definição inválida falha com mensagem clara.

## Alternativas consideradas

- **Uma animação própria por simulador:** repete código e dá controles diferentes em cada lugar.
- **Guardar o estado de todos os passos:** mais simples, mas cresce sem limite em simulações longas; os pontos de restauração mais a reaplicação dão o mesmo resultado com memória limitada.
- **Animação CSS/SMIL controlando o tempo:** não permite voltar a um estado exato nem testar sem navegador.

## Consequências

- Simuladores novos só descrevem estado, eventos e regras, e reaproveitam relógio, controles e linha do tempo.
- `apply` e `tick` não podem depender de nada fora do estado (aleatoriedade, relógio do sistema). Se um dia precisar de aleatoriedade, ela entra como semente dentro do estado.
- O arquivo ainda não é carregado pelo `index.html`; entra junto com o primeiro simulador (S2), para não baixar código sem uso.
