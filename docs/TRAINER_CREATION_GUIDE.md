# 🛠️ Guia de Criação de Trainers para Novos Jogos

Este guia orienta passo a passo como criar um trainer funcional do zero para qualquer jogo que não esteja catalogado no WeMod ou em outras plataformas.

---

## 🧭 Passo 1: Identificar a Engine do Jogo

Antes de tocar na memória, descubra qual tecnologia o jogo usa:

| Engine | Arquitetura de Memória | Ferramenta Recomendada |
| :--- | :--- | :--- |
| **Unity (Mono)** | Estruturas de classes gerenciadas em memória | **Cheat Engine (Mono Dissector)** ou **MelonLoader** |
| **Unity (IL2CPP)** | C++ nativo compilado de C# | **Il2CppDumper** + Cheat Engine |
| **Unreal Engine 4/5** | UObjects, FNames, GObjects, GNames | **Unreal Engine Dumper (UE4SS)** ou CE AOB Scan |
| **C++ / Custom Engine** | Binário nativo x64/x86 com ASLR | **Cheat Engine** + **x64dbg** |
| **Godot** | GDScript ou C# | Cheat Engine (Memory Scan tradicional) |

---

## 🎯 Passo 2: Localizar os Endereços de Memória (Exemplo: Vida Infinita)

1. **Inicie o Jogo e o Cheat Engine:**
   * Abra o executável do jogo no Cheat Engine (`File -> Open Process -> Selecione o jogo`).
2. **Faça o Escaneamento do Valor Inicial:**
   * Digite a quantidade de vida atual (ex: `100`), selecione `Value Type: 4 Bytes` (ou `Float` para barras de vida suaves) e clique em **First Scan**.
3. **Mude o Valor dentro do Jogo:**
   * Tome dano no jogo (a vida agora é `82`).
   * No Cheat Engine, digite `82` e clique em **Next Scan**.
   * Repita até sobrarem poucos endereços (idealmente 1 ou 2).
4. **Descubra a Instrução que Modifica a Vida:**
   * Clique com o botão direito no endereço final e selecione **"Find out what writes to this address"** (F6).
   * Tome dano novamente no jogo.
   * A janela do depurador mostrará a instrução que diminuiu a vida (ex: `mov [rsi+0x24], eax`).

---

## 📜 Passo 3: Criar a Assinatura AOB (Resiliente a Atualizações)

Para que o cheat não quebre na próxima vez que você abrir o jogo, **não use o endereço fixo**. Gere um padrão AOB:

1. Clique com o botão direito na instrução no depurador e escolha **"Show in Disassembler"**.
2. Abra `Tools -> Auto Assemble -> Template -> AOB Injection`.
3. O Cheat Engine gerará um padrão de bytes único (ex: `89 46 24 48 8B 05 ?? ?? ?? ??`).
4. **Extraia:**
   * `pattern`: Os bytes da instrução com wildcards `??`.
   * `replace`: Os bytes substitutos (ex: preencher com `90 90 90` para desativar a escrita de dano).

---

## 📦 Passo 4: Criar o Manifesto Declarativo

Adicione a definição na pasta de trainers do seu projeto (formato JSON):

```json
{
  "id": "hades-2",
  "title": "Hades II",
  "processName": "Hades2.exe",
  "version": "1.0.0",
  "cheats": [
    {
      "id": "god_mode",
      "name": "Modo Deus (Vida Infinita)",
      "category": "Jogador",
      "type": "aob_patch",
      "pattern": "89 46 24 48 8B 05 ?? ?? ?? ??",
      "replace": "90 90 90 48 8B 05 ?? ?? ?? ??",
      "hotkey": "F1"
    },
    {
      "id": "inf_gold",
      "name": "Ouro Infinito",
      "category": "Recursos",
      "type": "pointer_freeze",
      "baseModule": "Hades2.exe",
      "pointerChain": ["0x01A4B890", "0x38", "0x120"],
      "valueType": "int32",
      "value": 999999,
      "hotkey": "F2"
    }
  ]
}
```

---

## ⚡ Passo 5: Teste e Validação

1. Inicie o jogo.
2. Ative o cheat pelo atalho `F1`.
3. Confirme que o personagem não sofre dano.
4. Desative com `F1` e confira se a memória original foi restaurada sem travamentos.
