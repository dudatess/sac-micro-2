/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * Sistema de Internacionalização (i18n) simples
 * Carrega arquivos JSON e substitui textos na página
 * MODO: 100% MODULAR - Carrega JSONs individuais por página
 */

const I18n = {
    currentLang: 'pt',
    translations: {},

    // Inicializa o sistema (modo modular)
    async init() {
        // Tenta pegar do localStorage ou usa 'pt' como padrão
        this.currentLang = localStorage.getItem('courseLanguage') || 'pt';

        // Carrega traduções base necessárias para a UI global
        await this.loadBaseTranslations(this.currentLang);

        console.log(`[i18n] Sistema inicializado em modo MODULAR: ${this.currentLang}`);

        // Aplica traduções na página atual (header, sidebar, etc)
        this.translatePage();
    },

    // Carrega traduções base para UI global (modo modular)
    async loadBaseTranslations(lang) {
        document.documentElement.lang = lang;

        // Carregar JSONs base necessários para interface global
        const baseFiles = [
            { path: 'ui.json', mount: 'ui' },
            { path: 'settings.json', mount: 'settings' },
            { path: 'tutorial.json', mount: 'tutorial' },
            { path: 'global.json', mount: 'global' },
            { path: 'menu.json', mount: 'menu' },
            { path: 'tts.json', mount: 'tts' }
        ];

        for (const file of baseFiles) {
            await this.loadPageTranslation(lang, file.path, file.mount);
        }
    },


    // Carrega traduções modulares para uma página específica
    async loadPageTranslation(lang, pagePath, mountPoint) {
        try {
            const response = await fetch(`locales/${lang}/${pagePath}`);
            if (!response.ok) {
                console.warn(`[i18n] Arquivo modular não encontrado: locales/${lang}/${pagePath}`);
                return false;
            }
            const pageTranslations = await response.json();

            // Mescla as traduções no mountPoint especificado
            this.setNestedTranslation(mountPoint, pageTranslations);
            console.log(`[i18n] Traduções carregadas: ${pagePath} -> ${mountPoint}`);
            return true;
        } catch (error) {
            console.warn(`[i18n] Erro ao carregar tradução modular: ${pagePath}`, error);
            return false;
        }
    },

    // Define valor em objeto aninhado usando path "chave.subchave"
    setNestedTranslation(path, value) {
        const keys = path.split('.');
        let current = this.translations;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }

        const lastKey = keys[keys.length - 1];
        if (typeof current[lastKey] === 'object' && typeof value === 'object') {
            Object.assign(current[lastKey], value);
        } else {
            current[lastKey] = value;
        }
    },


    // Muda o idioma e recarrega a página
    async setLanguage(lang) {
        if (lang === this.currentLang) return;

        this.currentLang = lang;
        localStorage.setItem('courseLanguage', lang);

        // Limpa traduções e recarrega para novo idioma
        this.translations = {};
        await this.loadBaseTranslations(lang);

        // Dispara evento para outros componentes se atualizarem
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));

        // Marcar que estamos trocando idioma (para não fechar SCORM)
        sessionStorage.setItem('isLanguageChange', 'true');

        // Recarrega a página atual para carregar traduções modulares
        location.reload();
    },

    // Traduz a página atual procurando por elementos com data-i18n
    translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');

        elements.forEach(el => {
            let key = el.getAttribute('data-i18n');
            let useHtml = false;

            // Detectar e remover prefixo [html] se presente
            if (key.startsWith('[html]')) {
                useHtml = true;
                key = key.substring(6); // Remove '[html]' (6 caracteres)
            }

            const translation = this.getNestedTranslation(key);

            if (translation) {
                // Se for input/textarea usa placeholder, imagem usa alt, senão innerHTML
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    if (el.hasAttribute('placeholder')) {
                        el.setAttribute('placeholder', translation);
                    }
                } else if (el.tagName === 'IMG') {
                    el.setAttribute('alt', translation);
                } else {
                    // Usa innerHTML (permite HTML nas traduções)
                    el.innerHTML = translation;
                }
            } else {
                console.warn(`[i18n] Chave não encontrada: ${key}`);
            }
        });

        // Traduz atributos aria-label (data-i18n-aria)
        const ariaElements = document.querySelectorAll('[data-i18n-aria]');
        ariaElements.forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            const translation = this.getNestedTranslation(key);
            if (translation) {
                // Remove emoji para aria-label (acessibilidade)
                const cleanText = translation.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
                el.setAttribute('aria-label', cleanText);
            }
        });

        // Traduz atributos title (data-i18n-title)
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = this.getNestedTranslation(key);
            if (translation) {
                // Remove emoji para title (tooltip)
                const cleanText = translation.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
                el.setAttribute('title', cleanText);
            }
        });

        // Traduz title da página se houver chave específica
        // const pageTitle = this.getNestedTranslation('global.page_title');
        // if (pageTitle) document.title = pageTitle;
    },

    // Função auxiliar para pegar valor de objeto aninhado "chave.subchave"
    getNestedTranslation(key) {
        return key.split('.').reduce((obj, k) => (obj && obj[k] !== 'undefined') ? obj[k] : null, this.translations);
    },

    // Retorna uma tradução específica (para uso via JS) com suporte a variáveis {{key}}
    t(key, params = null) {
        let translation = this.getNestedTranslation(key) || key;

        if (params && typeof params === 'object') {
            Object.keys(params).forEach(p => {
                const regex = new RegExp(`{{${p}}}`, 'g');
                translation = translation.replace(regex, params[p]);
            });
        }

        return translation;
    }
};

// Expor para o escopo global
window.I18n = I18n;

// Auto-inicialização se carregado no browser (opcional, melhor controlar via app.js)
// document.addEventListener('DOMContentLoaded', () => I18n.init());
