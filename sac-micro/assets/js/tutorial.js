/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * Tutorial interativo com efeito spotlight
 * Guia o usuário pelos elementos principais da interface
 */
const Tutorial = {
    currentStep: 0,
    isActive: false,

    // Passos do tutorial com seletor do elemento e chave i18n
    steps: [
        {
            selector: '#sidebar',
            textKey: 's1',
            position: 'right'
        },
        {
            selector: '[data-module-id="extras"] .module-title',
            textKey: 's2',
            position: 'right'
        },
        {
            selector: '#btn-menu',
            textKey: 's3',
            position: 'bottom'
        },
        {
            selector: '#btn-settings',
            textKey: 's4',
            position: 'bottom'
        },
        {
            selector: '.settings-row:has(#btn-dyslexia)',
            textKey: 's5',
            position: 'bottom',
            openSettings: true
        },
        {
            selector: '.settings-row:has(#btn-auto-read)',
            textKey: 's6',
            position: 'bottom',
            openSettings: true
        },
        {
            selector: '.settings-row-vertical:has(#voice-select)',
            textKey: 's7',
            position: 'bottom',
            openSettings: true
        },
        {
            selector: '#tts-controls',
            textKey: 's8',
            position: 'bottom',
            closeSettings: true
        },
        {
            selector: '#tutorial-interactive-demo',
            textKey: 's9',
            position: 'bottom',
            showInteractiveDemo: true
        },
        {
            selector: '.content-nav',
            textKey: 's10',
            position: 'top',
            hideInteractiveDemo: true
        },
        {
            selector: '.content-nav',
            textKey: 's11',
            position: 'top'
        }
    ],

    init: function () {
        // Bind do botão de iniciar tutorial (se existir na página carregada)
        this.bindStartButton();
    },

    bindStartButton: function () {
        // Usa event delegation para capturar cliques no botão de tutorial
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-start-tutorial' || e.target.closest('#btn-start-tutorial')) {
                e.preventDefault();
                this.start();
            }
        });

        // Bind dos botões do overlay
        document.getElementById('tutorial-next')?.addEventListener('click', () => this.next());
        document.getElementById('tutorial-skip')?.addEventListener('click', () => this.end());

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.end();
            }
        });
    },

    start: function () {
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();

        // Se o sidebar estiver colapsado, abrir antes de iniciar o tutorial
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            const btnMenu = document.getElementById('btn-menu');
            if (btnMenu) {
                btnMenu.classList.remove('active');
            }
        }

        this.currentStep = 0;
        this.isActive = true;
        document.body.classList.add('tutorial-active');
        document.getElementById('tutorial-overlay').classList.add('active');
        document.getElementById('tutorial-tooltip').classList.add('active');
        this.showStep(0);
    },

    next: function () {
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        // Remove highlight do elemento anterior
        this.clearHighlight();

        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.end();
        } else {
            this.showStep(this.currentStep);
        }
    },

    showStep: function (stepIndex) {
        const step = this.steps[stepIndex];
        const settingsModal = document.getElementById('modal-settings');
        const interactiveDemo = document.getElementById('tutorial-interactive-demo');

        // Abrir modal de configurações se necessário
        if (step.openSettings && settingsModal) {
            settingsModal.classList.add('active');
        }

        // Fechar modal de configurações se necessário
        if (step.closeSettings && settingsModal) {
            settingsModal.classList.remove('active');
        }

        // Mostrar demo de elemento interativo se necessário
        if (step.showInteractiveDemo && interactiveDemo) {
            interactiveDemo.classList.add('active');
            interactiveDemo.style.display = 'block';
            // Adicionar animação de tremor contínua
            const demoCard = interactiveDemo.querySelector('.tutorial-demo-card');
            if (demoCard) {
                demoCard.classList.add('wiggle-animate');
                // Reiniciar animação periodicamente
                this.demoInterval = setInterval(() => {
                    demoCard.classList.remove('wiggle-animate');
                    void demoCard.offsetWidth;
                    demoCard.classList.add('wiggle-animate');
                }, 2000);
            }
        }

        // Esconder demo de elemento interativo se necessário
        if (step.hideInteractiveDemo && interactiveDemo) {
            interactiveDemo.classList.remove('active');
            interactiveDemo.style.display = 'none';
            if (this.demoInterval) {
                clearInterval(this.demoInterval);
                this.demoInterval = null;
            }
        }

        // Pequeno delay para garantir que o modal/demo esteja aberto/fechado
        setTimeout(() => {
            const element = document.querySelector(step.selector);

            if (!element) {
                console.warn('Tutorial: Element not found:', step.selector);
                this.next();
                return;
            }

            // Highlight no elemento
            element.classList.add('tutorial-highlight');

            // Scroll suave para o elemento se necessário (não para demo popup)
            if (!step.showInteractiveDemo) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Posicionar tooltip
            setTimeout(() => {
                this.positionTooltip(element, step.position);
            }, 300);

            // Atualizar texto (usar I18n.t se disponível)
            const stepText = (typeof I18n !== 'undefined' && I18n.t(`tutorial.steps.${step.textKey}`))
                ? I18n.t(`tutorial.steps.${step.textKey}`)
                : step.textKey;
            document.getElementById('tutorial-text').innerHTML = stepText;

            // Ler texto do tutorial com TTS
            if (typeof AccessibilityManager !== 'undefined') {
                const cleanText = stepText.replace(/<[^>]*>/g, '');
                setTimeout(() => {
                    AccessibilityManager.speakElement(cleanText);
                }, 500);
            }

            const stepIndicator = (typeof I18n !== 'undefined' && I18n.t('tutorial.step_indicator'))
                ? I18n.t('tutorial.step_indicator')
                : 'de';
            document.getElementById('tutorial-step-indicator').textContent =
                `${stepIndex + 1} ${stepIndicator} ${this.steps.length}`;

            // Botão de próximo ou finalizar (usar I18n.t se disponível)
            const nextBtn = document.getElementById('tutorial-next');
            if (stepIndex === this.steps.length - 1) {
                nextBtn.textContent = (typeof I18n !== 'undefined' && I18n.t('tutorial.buttons.finish'))
                    ? I18n.t('tutorial.buttons.finish')
                    : 'Finalizar ✓';
            } else {
                nextBtn.textContent = (typeof I18n !== 'undefined' && I18n.t('tutorial.buttons.next'))
                    ? I18n.t('tutorial.buttons.next')
                    : 'Próximo →';
            }
        }, step.openSettings || step.closeSettings || step.showInteractiveDemo ? 300 : 0);
    },

    positionTooltip: function (element, position) {
        const tooltip = document.getElementById('tutorial-tooltip');
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top, left;
        const margin = 20;

        switch (position) {
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + margin;
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - margin;
                break;
            case 'top':
                top = rect.top - tooltipRect.height - margin;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
            default:
                top = rect.bottom + margin;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
        }

        // Garantir que não saia da tela
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    },

    clearHighlight: function () {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    },

    end: function () {
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        this.isActive = false;
        this.clearHighlight();
        document.body.classList.remove('tutorial-active');
        document.getElementById('tutorial-overlay').classList.remove('active');
        document.getElementById('tutorial-tooltip').classList.remove('active');

        // Fechar modal de configurações se estiver aberto
        const settingsModal = document.getElementById('modal-settings');
        if (settingsModal) {
            settingsModal.classList.remove('active');
        }

        // Esconder demo de elemento interativo
        const interactiveDemo = document.getElementById('tutorial-interactive-demo');
        if (interactiveDemo) {
            interactiveDemo.classList.remove('active');
            interactiveDemo.style.display = 'none';
        }
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
            this.demoInterval = null;
        }

        this.currentStep = 0;

        // Marcar tutorial como concluído e desbloquear navegação
        localStorage.setItem('tutorial-completed', 'true');
        const btnNext = document.getElementById('btn-next');
        if (btnNext) {
            btnNext.disabled = false;
        }
        // Remover mensagem de tutorial
        const startMsg = document.querySelector('.start-message');
        if (startMsg) {
            startMsg.style.display = 'none';
        }
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    Tutorial.init();
});
