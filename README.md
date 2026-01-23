# Curso: Canais de Comunicação SAC - Grupo Zaffari

Bem-vindo ao repositório do curso **"Canais de Comunicação SAC"**. Este projeto é um microlearning interativo desenvolvido para capacitar a equipe de atendimento sobre os diversos pontos de contato do SAC.

## 📋 Visão Geral

- **Formato:** SCORM 1.2 + PWA (Progressive Web App)
- **Idiomas:** Português (PT), Inglês (EN), Espanhol (ES), Francês (FR)
- **Tecnologia:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **Tamanho:** ~3.7 MB
- **Duração:** 12-20 minutos

## 🚀 Como Rodar Localmente

Este projeto não requer instalação de dependências complexas para rodar em modo de desenvolvimento, pois utiliza JavaScript puro.

### Pré-requisitos
- Navegador moderno (Chrome, Edge, Firefox)
- Extensão "Live Server" (VS Code) ou Python para servidor local

### Opção 1: Via Python
```bash
# Na raiz do projeto
python -m http.server 8000
# Acesse: http://localhost:8000
```

### Opção 2: VS Code
Abra o arquivo `index.html` e clique em "Open with Live Server".

## 🛠️ Build e Distribuição

O projeto possui um script de automação (`build.js`) para preparar o pacote final.

```bash
# Executar build (Requer Node.js instalado)
node build.js
```

**O que o script faz:**
1.  Limpa a pasta `dist/` antiga.
2.  Copia recursivamente os arquivos do projeto.
3.  Minifica HTML, CSS e JSON (Basic Stripping).
4.  Gera a estrutura pronta para compactação ZIP (SCORM).

## 📁 Estrutura do Projeto

```
sac-micro/
├── index.html              # App Shell (Carrega o curso)
├── imsmanifest.xml         # Arquivo de manifesto SCORM 1.2
├── content.json            # Roteiro e estrutura de módulos
├── build.js                # Script de build
│
├── assets/                 # Recursos estáticos
│   ├── css/                # Estilos (Tema Amber/Orange)
│   ├── js/                 # Lógica (i18n, SCORM, Navegação)
│   └── marca/              # Logos e identidade visual
│
├── locales/                # Arquivos de tradução (i18n)
│   ├── pt/, es/, en/, fr/  # JSONs por módulo
│
└── paginas/                # Conteúdo fragmentado (HTML)
```

## 👥 Contatos e Suporte

**Desenvolvido para Grupo Zaffari**

### Equipe
| Nome | E-mail |
|------|--------|
| **Felipe Correa Bitencourt** | felipe.cb2511@gmail.com |
| **Eduarda Tessari Pereira** | dudatessari@gmail.com |

---
*Gerado em: Janeiro de 2026*
