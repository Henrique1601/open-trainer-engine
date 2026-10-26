# 🎮 Detecção Universal de Jogos (Library Scanner)

Este documento detalha os algoritmos para encontrar e catalogar automaticamente os jogos instalados no computador do usuário em cada uma das principais plataformas.

---

## 🏬 1. Steam

A Steam organiza os jogos através de pastas de bibliotecas e manifestos em formato VDF (Valve Data Format):

1. **Localizar a Instalação da Steam:**
   * Ler a chave de registro do Windows:
     `HKEY_CURRENT_USER\Software\Valve\Steam\SteamPath`
2. **Listar Todas as Bibliotecas de Disco:**
   * Ler o arquivo de configuração:
     `<SteamPath>/steamapps/libraryfolders.vdf`
   * Esse arquivo lista todos os discos e diretórios onde o usuário instalou jogos (ex: `D:\SteamLibrary`, `E:\Games`).
3. **Identificar os Jogos Instalados:**
   * Em cada pasta de biblioteca, ler os manifestos:
     `<LibraryPath>/steamapps/appmanifest_<AppID>.acf`
   * Campos extraídos:
     * `appid`: ID numérico único do jogo na Steam.
     * `name`: Nome legível do título.
     * `installdir`: Nome da pasta onde os executáveis estão localizados.
     * `buildid`: Número exato da build instalada (útil para saber se o jogo foi atualizado).

---

## ⚡ 2. Epic Games Launcher

A Epic Games armazena os manifestos em formato JSON direto no ProgramData:

1. **Diretório de Manifestos:**
   `%ProgramData%\Epic\EpicGamesLauncher\Data\Manifests\*.item`
2. **Campos Relevantes do JSON:**
   * `AppName`: Nome interno da aplicação.
   * `DisplayName`: Nome do jogo exibido ao jogador.
   * `InstallLocation`: Caminho absoluto no disco rígido.
   * `LaunchExecutable`: Nome do executável principal.
   * `CatalogItemId` e `CatalogNamespace`: Identificadores únicos do catálogo.
3. **Comando de Inicialização Silenciosa:**
   ```text
   com.epicgames.launcher://apps/{AppName}?action=launch&silent=true
   ```

---

## 🌌 3. GOG Galaxy

O GOG Galaxy registra os jogos instalados diretamente no registro do Windows:

1. **Chaves de Registro:**
   * `HKEY_LOCAL_MACHINE\SOFTWARE\GOG.com\Games` (ou `SOFTWARE\WOW6432Node\GOG.com\Games`)
2. **Subchaves:**
   * Cada subchave corresponde ao GameID (ex: `1207658924`).
   * Valores:
     * `PATH`: Diretório de instalação.
     * `EXE`: Executável do jogo.
     * `GAMENAME`: Nome oficial.
     * `VER`: Versão instalada.

---

## 🟢 4. Xbox Game Pass / Microsoft Store (UWP & WinRT)

Os jogos do aplicativo Xbox no Windows ficam localizados dentro da pasta protegida `WindowsApps`:

1. **APIs WinRT para Leitura Segura:**
   * Usar a API do Windows `Windows.Management.Deployment.PackageManager`.
   * Chamar `FindPackagesForCurrentUser()` e filtrar pacotes com declaração de jogo.
2. **Manifesto `AppxManifest.xml`:**
   * Extrair nome do pacote, executável inicial e capacidades.
3. **Bypass de Privilégios:**
   * Como a pasta `WindowsApps` tem restrições estritas de ACL do NTFS, o processo precisa solicitar elevação ou usar o `ElevationService` para inspecionar executáveis.

---

## 📂 5. Jogos Standalone / Customizados

Para jogos portáteis, cópias locais ou lojas independentes (ex: itch.io):
* O usuário pode apontar manualmente para o executável `.exe` ou arrastar a pasta do jogo para a interface.
* O motor calcula o hash SHA-256 do executável para associá-lo automaticamente ao trainer correto.
