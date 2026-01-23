/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * keyboard.js - Atalhos de Teclado
 * Gerencia navegação e ações via teclado
 */

const KeyboardManager = {
    enabled: true,

    /**
     * Inicializa os atalhos de teclado
     */
    init: function () {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        console.log('KeyboardManager initialized');
    },

    /**
     * Handler principal de teclas
     */
    handleKeydown: function (e) {
        // Não processar se estiver em input/textarea
        if (this.isTyping(e.target)) return;

        // Não processar se tutorial estiver ativo (exceto Esc)
        if (typeof Tutorial !== 'undefined' && Tutorial.isActive && e.key !== 'Escape') {
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
                this.navigatePrev();
                e.preventDefault();
                break;

            case 'ArrowRight':
                this.navigateNext();
                e.preventDefault();
                break;

            case 'Escape':
                this.closeModals();
                e.preventDefault();
                break;

            case 'm':
            case 'M':
                this.toggleMenu();
                e.preventDefault();
                break;

            case '?':
                this.showShortcutsHelp();
                e.preventDefault();
                break;
        }
    },

    /**
     * Verifica se o usuário está digitando em um campo
     */
    isTyping: function (target) {
        const tagName = target.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
    },

    /**
     * Navega para a página anterior
     */
    navigatePrev: function () {
        const btnPrev = document.getElementById('btn-prev');
        if (btnPrev && !btnPrev.disabled) {
            btnPrev.click();
        }
    },

    /**
     * Navega para a próxima página
     */
    navigateNext: function () {
        const btnNext = document.getElementById('btn-next');
        if (btnNext && !btnNext.disabled) {
            btnNext.click();
        }
    },

    /**
     * Fecha todos os modais abertos
     */
    closeModals: function () {
        // Fechar modal de configurações
        const settingsModal = document.getElementById('modal-settings');
        if (settingsModal && settingsModal.classList.contains('active')) {
            settingsModal.classList.remove('active');
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            return;
        }

        // Fechar modal de feedback
        const feedbackModal = document.getElementById('modal-feedback');
        if (feedbackModal && feedbackModal.classList.contains('active')) {
            feedbackModal.classList.remove('active');
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            return;
        }

        // Fechar modais de conteúdo
        const contentModals = document.querySelectorAll('#content-area .modal-overlay.active');
        contentModals.forEach(modal => {
            modal.classList.remove('active');
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        });

        // Fechar tutorial se ativo
        if (typeof Tutorial !== 'undefined' && Tutorial.isActive) {
            Tutorial.end();
        }
    },

    /**
     * Toggle do menu lateral
     */
    toggleMenu: function () {
        const sidebar = document.getElementById('sidebar');
        const btnMenu = document.getElementById('btn-menu');

        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            if (btnMenu) {
                btnMenu.classList.toggle('active', sidebar.classList.contains('collapsed'));
            }
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        }
    },

    /**
     * Mostra ajuda de atalhos (feedback temporário)
     */
    showShortcutsHelp: function () {
        if (typeof FeedbackManager !== 'undefined') {
            FeedbackManager.show(
                '⌨️ Atalhos: ← Anterior | → Próximo | Esc Fechar | M Menu',
                'info'
            );
        }
    }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    KeyboardManager.init();
});
