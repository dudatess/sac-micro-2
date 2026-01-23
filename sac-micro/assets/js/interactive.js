/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * interactive.js - Componentes Interativos
 * Gerencia modais, cards, accordions, sliders, glossário e animações
 */

const InteractiveComponents = {
    wiggleInterval: null,
    glossaryPopup: null,

    // Glossário de termos técnicos
    glossary: {
        'cdc': {
            term: 'CDC',
            definition: 'Código de Defesa do Consumidor (Lei nº 8.078/90) - Legislação brasileira que protege os direitos do consumidor em todas as relações de consumo.'
        },
        'sac': {
            term: 'SAC',
            definition: 'Serviço de Atendimento ao Cliente - Setor responsável por gerenciar os canais de relacionamento com clientes, incluindo atendimentos eletrônicos e telefônicos.'
        },
        'sla': {
            term: 'SLA',
            definition: 'Service Level Agreement (Acordo de Nível de Serviço) - Contrato que define os prazos e padrões de qualidade esperados no atendimento.'
        },
        'nps': {
            term: 'NPS',
            definition: 'Net Promoter Score - Métrica que mede a satisfação e lealdade dos clientes através de uma pergunta simples sobre recomendação.'
        },
        'procon': {
            term: 'PROCON',
            definition: 'Programa de Proteção e Defesa do Consumidor - Órgão público responsável por mediar conflitos entre consumidores e fornecedores.'
        },
        'reclame-aqui': {
            term: 'Reclame Aqui',
            definition: 'Plataforma online brasileira onde consumidores registram reclamações sobre empresas e avaliam o atendimento recebido.'
        },
        'omnichannel': {
            term: 'Omnichannel',
            definition: 'Estratégia de atendimento integrado que oferece experiência consistente em todos os canais (telefone, chat, e-mail, redes sociais).'
        },
        'chargeback': {
            term: 'Chargeback',
            definition: 'Contestação de compra feita pelo consumidor junto à operadora do cartão, resultando no estorno do valor.'
        }
    },

    /**
     * Inicializa todos os componentes interativos na área de conteúdo
     */
    init: function () {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        this.initModals(contentArea);
        this.initInteractiveCards(contentArea);
        this.initFlipCards(contentArea);
        this.initRevealButtons(contentArea);
        this.initAccordions(contentArea);
        this.initSliders(contentArea);
        this.initGlossary(contentArea);
        this.startWiggleSync();
    },

    /**
     * Inicializa modais de conteúdo
     */
    initModals: function (contentArea) {
        // Abrir modais
        contentArea.querySelectorAll('.btn-modal-trigger').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const modalId = btn.dataset.modal;
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('active');
                    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                    if (typeof Analytics !== 'undefined') Analytics.trackClick('modal');

                    // Ler título + conteúdo do modal quando abrir
                    if (typeof AccessibilityManager !== 'undefined') {
                        const modalTitle = modal.querySelector('.modal-header h3');
                        const modalBody = modal.querySelector('.modal-body, .modal-content');

                        if (modalTitle && modalBody) {
                            console.log('[Modal] Lendo título + conteúdo');
                            const fullText = modalTitle.textContent + '. ' + modalBody.textContent;
                            AccessibilityManager.speakElement(fullText);
                        } else if (modalBody) {
                            console.log('[Modal] Lendo apenas conteúdo');
                            AccessibilityManager.speakElement(modalBody);
                        } else {
                            console.log('[Modal] Nenhum conteúdo encontrado para ler');
                        }
                    }
                }
            };
        });

        // Fechar modais com botão X
        contentArea.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const modal = btn.closest('.modal-overlay');
                if (modal) {
                    modal.classList.remove('active');
                    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                }
            };
        });

        // Fechar modais clicando fora
        contentArea.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            };
        });
    },

    /**
     * Inicializa cards interativos expansíveis
     */
    initInteractiveCards: function (contentArea) {
        contentArea.querySelectorAll('.interactive-card').forEach(card => {
            card.onclick = () => {
                card.classList.add('user-interacted');
                card.classList.remove('wiggle-animate');
                const wasExpanded = card.classList.contains('expanded');
                card.classList.toggle('expanded');
                if (typeof AudioManager !== 'undefined') AudioManager.playExpand();
                if (typeof Analytics !== 'undefined') Analytics.trackClick('interactive-card');

                // Notificar AccessibilityManager sobre interação
                if (typeof AccessibilityManager !== 'undefined') {
                    AccessibilityManager.onInteractiveElementClicked(card);

                    // Ler título + conteúdo do card quando expandir
                    if (!wasExpanded) {
                        const header = card.querySelector('.interactive-card-header');
                        const content = card.querySelector('.interactive-card-content');
                        if (header && content) {
                            const fullText = header.textContent + '. ' + content.textContent;
                            AccessibilityManager.speakElement(fullText);
                        } else if (content) {
                            AccessibilityManager.speakElement(content);
                        }
                    }
                }
            };
            card.onkeypress = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.classList.add('user-interacted');
                    card.classList.remove('wiggle-animate');
                    const wasExpanded = card.classList.contains('expanded');
                    card.classList.toggle('expanded');
                    if (typeof AudioManager !== 'undefined') AudioManager.playExpand();
                    if (typeof Analytics !== 'undefined') Analytics.trackClick('interactive-card');
                    // Ler conteúdo do card quando expandir
                    if (!wasExpanded && typeof AccessibilityManager !== 'undefined') {
                        const content = card.querySelector('.interactive-card-content');
                        if (content) AccessibilityManager.speakElement(content);
                    }
                }
            };
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
        });
    },

    /**
     * Inicializa flip cards (Você Sabia?)
     */
    initFlipCards: function (contentArea) {
        contentArea.querySelectorAll('.flip-card').forEach(card => {
            // Adicionar listener para notificar AccessibilityManager
            const originalOnclick = card.onclick;
            card.onclick = function (e) {
                // Executar flip original
                if (originalOnclick) originalOnclick.call(this, e);

                // Notificar AccessibilityManager
                if (typeof AccessibilityManager !== 'undefined') {
                    AccessibilityManager.onInteractiveElementClicked(card);

                    // Ler título + conteúdo do verso após flip (aguardar animação)
                    setTimeout(() => {
                        if (card.classList.contains('flipped')) {
                            const frontTitle = card.querySelector('.flip-card-front h4');
                            const backDiv = card.querySelector('.flip-card-back');
                            if (frontTitle && backDiv) {
                                console.log('[Flip Card] Lendo título + conteúdo do verso');
                                const fullText = frontTitle.textContent + '. ' + backDiv.textContent;
                                AccessibilityManager.speakElement(fullText);
                            } else if (backDiv) {
                                AccessibilityManager.speakElement(backDiv);
                            }
                        }
                    }, 400); // Delay reduzido para melhor UX
                }
            };
        });
    },

    /**
     * Inicializa botões de revelar conteúdo
     */
    initRevealButtons: function (contentArea) {
        contentArea.querySelectorAll('.reveal-btn').forEach(btn => {
            btn.onclick = () => {
                btn.classList.remove('wiggle-animate');
                const container = btn.closest('.reveal-container');
                const content = container?.querySelector('.reveal-content');
                if (content) {
                    content.classList.add('visible');
                    btn.classList.add('revealed');
                    btn.textContent = '✓ Revelado';
                    btn.disabled = true;
                    if (typeof AudioManager !== 'undefined') AudioManager.playExpand();

                    // Notificar AccessibilityManager sobre interação
                    if (typeof AccessibilityManager !== 'undefined') {
                        AccessibilityManager.onInteractiveElementClicked(btn);
                        // Ler título do botão + conteúdo revelado
                        const fullText = btn.textContent + '. ' + content.textContent;
                        AccessibilityManager.speakElement(fullText);
                    }
                }
            };
        });
    },

    /**
     * Inicializa accordions (Q&A, etc)
     */
    initAccordions: function (contentArea) {
        contentArea.querySelectorAll('.accordion details').forEach(details => {
            const summary = details.querySelector('summary');
            if (summary) {
                summary.addEventListener('click', () => {
                    if (typeof AudioManager !== 'undefined') AudioManager.playExpand();
                    if (typeof Analytics !== 'undefined') Analytics.trackClick('accordion');

                    // Notificar AccessibilityManager sobre interação
                    if (typeof AccessibilityManager !== 'undefined') {
                        AccessibilityManager.onInteractiveElementClicked(details);

                        // Ler título + conteúdo do accordion quando abrir
                        if (!details.open) {
                            setTimeout(() => {
                                if (details.open) {
                                    const question = summary.textContent;
                                    // Buscar conteúdo: .qa-answer ou todo o conteúdo do details
                                    let answer = details.querySelector('.qa-answer');
                                    if (!answer) {
                                        // Se não tem .qa-answer, pegar todo o conteúdo exceto summary
                                        const allContent = Array.from(details.children)
                                            .filter(child => child.tagName !== 'SUMMARY')
                                            .map(child => child.textContent)
                                            .join(' ');
                                        if (allContent) {
                                            const fullText = question + '. ' + allContent;
                                            AccessibilityManager.speakElement(fullText);
                                        }
                                    } else {
                                        const fullText = question + '. ' + answer.textContent;
                                        AccessibilityManager.speakElement(fullText);
                                    }
                                }
                            }, 100);
                        }
                    }
                });
            }
        });
    },

    /**
     * Inicializa sliders de conteúdo
     */
    initSliders: function (contentArea) {
        contentArea.querySelectorAll('.content-slider').forEach(slider => {
            const slides = slider.querySelectorAll('.slider-slide');
            const prevBtn = slider.querySelector('.slider-prev');
            const nextBtn = slider.querySelector('.slider-next');
            const dots = slider.querySelectorAll('.slider-dot');
            let currentSlide = 0;

            const showSlide = (index) => {
                slides.forEach((slide, i) => {
                    slide.classList.toggle('hidden', i !== index);
                });
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
                if (prevBtn) prevBtn.disabled = index === 0;
                if (nextBtn) nextBtn.disabled = index === slides.length - 1;
                currentSlide = index;

                // Notificar AccessibilityManager sobre mudança de passo
                if (typeof AccessibilityManager !== 'undefined' && AccessibilityManager.readingState.waitingForInteraction) {
                    const currentSlideElement = slides[index];
                    if (currentSlideElement && index > 0) { // Não ler o primeiro (já foi lido)
                        const text = AccessibilityManager.getStructuredText(currentSlideElement);
                        setTimeout(() => {
                            AccessibilityManager.speakElement(text);
                        }, 300);
                    }


                    // Se chegou no último passo, aguardar leitura terminar e continuar
                    if (index === slides.length - 1) {
                        const checkAndContinue = () => {
                            if (AccessibilityManager.speaking) {
                                // Ainda está lendo, aguardar mais
                                setTimeout(checkAndContinue, 200);
                            } else {
                                // Terminou de ler, continuar
                                slider.classList.remove('tts-waiting');
                                AccessibilityManager.readingState.waitingForInteraction = false;
                                AccessibilityManager.readingState.currentSegmentIndex++;
                                setTimeout(() => {
                                    AccessibilityManager.speakNextSegment();
                                }, 500);
                            }
                        };
                        // Aguardar tempo mínimo para speakElement ser chamado
                        setTimeout(checkAndContinue, 600);
                    }
                }
            };

            if (prevBtn) {
                prevBtn.onclick = () => {
                    if (currentSlide > 0) {
                        showSlide(currentSlide - 1);
                        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                    }
                };
            }

            if (nextBtn) {
                nextBtn.onclick = () => {
                    if (currentSlide < slides.length - 1) {
                        showSlide(currentSlide + 1);
                        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                    }
                };
            }

            dots.forEach((dot, i) => {
                dot.onclick = () => {
                    showSlide(i);
                    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                };
            });

            // Inicializar no primeiro slide
            if (slides.length > 0) {
                showSlide(0);
            }
        });
    },

    /**
     * Inicializa glossário interativo
     */
    initGlossary: function (contentArea) {
        // Criar popup de glossário se não existir
        if (!this.glossaryPopup) {
            this.glossaryPopup = document.createElement('div');
            this.glossaryPopup.className = 'glossary-popup';
            this.glossaryPopup.innerHTML = `
                <div class="glossary-popup-header">
                    <strong class="glossary-popup-term"></strong>
                    <button class="glossary-popup-close" aria-label="Fechar">×</button>
                </div>
                <p class="glossary-popup-definition"></p>
            `;
            document.body.appendChild(this.glossaryPopup);

            // Fechar ao clicar no X
            this.glossaryPopup.querySelector('.glossary-popup-close').onclick = () => {
                this.hideGlossaryPopup();
            };

            // Fechar ao clicar fora
            document.addEventListener('click', (e) => {
                if (this.glossaryPopup.classList.contains('active') &&
                    !this.glossaryPopup.contains(e.target) &&
                    !e.target.classList.contains('glossary-term')) {
                    this.hideGlossaryPopup();
                }
            });

            // Fechar com Esc
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.glossaryPopup.classList.contains('active')) {
                    this.hideGlossaryPopup();
                }
            });
        }

        // Inicializar termos do glossário
        contentArea.querySelectorAll('.glossary-term').forEach(term => {
            term.setAttribute('tabindex', '0');
            term.setAttribute('role', 'button');
            term.setAttribute('aria-haspopup', 'dialog');

            term.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showGlossaryPopup(term);
            };

            term.onkeypress = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showGlossaryPopup(term);
                }
            };
        });
    },

    /**
     * Exibe popup do glossário
     */
    showGlossaryPopup: function (termElement) {
        const termId = termElement.dataset.term;
        const glossaryEntry = this.glossary[termId];

        if (!glossaryEntry) {
            // Fallback: usar o texto do próprio elemento e data-definition se existir
            const term = termElement.textContent;
            const definition = termElement.dataset.definition || 'Definição não encontrada.';
            this.glossaryPopup.querySelector('.glossary-popup-term').textContent = term;
            this.glossaryPopup.querySelector('.glossary-popup-definition').textContent = definition;
        } else {
            this.glossaryPopup.querySelector('.glossary-popup-term').textContent = glossaryEntry.term;
            this.glossaryPopup.querySelector('.glossary-popup-definition').textContent = glossaryEntry.definition;
        }

        // Posicionar popup
        const rect = termElement.getBoundingClientRect();
        const popup = this.glossaryPopup;

        popup.classList.add('active');

        // Calcular posição
        let top = rect.bottom + 10;
        let left = rect.left;

        // Ajustar se sair da tela
        const popupRect = popup.getBoundingClientRect();
        if (left + popupRect.width > window.innerWidth - 20) {
            left = window.innerWidth - popupRect.width - 20;
        }
        if (top + popupRect.height > window.innerHeight - 20) {
            top = rect.top - popupRect.height - 10;
        }

        popup.style.top = top + 'px';
        popup.style.left = Math.max(10, left) + 'px';

        if (typeof AudioManager !== 'undefined') AudioManager.playClick();

        // Ler definição do glossário com TTS
        if (typeof AccessibilityManager !== 'undefined') {
            const termText = this.glossaryPopup.querySelector('.glossary-popup-term').textContent;
            const defText = this.glossaryPopup.querySelector('.glossary-popup-definition').textContent;
            AccessibilityManager.speakElement(termText + '. ' + defText);
        }
    },

    /**
     * Esconde popup do glossário
     */
    hideGlossaryPopup: function () {
        if (this.glossaryPopup) {
            this.glossaryPopup.classList.remove('active');
        }
    },

    /**
     * Sincroniza animação de wiggle em todos os elementos interativos
     */
    startWiggleSync: function () {
        // Limpar intervalo anterior se existir
        if (this.wiggleInterval) {
            clearInterval(this.wiggleInterval);
        }

        const triggerWiggle = () => {
            // Selecionar APENAS elementos que são realmente clicáveis e expandem/revelam conteúdo
            // Excluir elementos já interagidos pelo usuário (user-interacted)
            const elements = document.querySelectorAll(
                '.interactive-card:not(.expanded):not(.user-interacted), ' +
                '.accordion details:not([open]):not(.user-interacted), ' +
                '.reveal-btn:not(.revealed):not(.user-interacted), ' +
                '#btn-start-tutorial'
            );

            elements.forEach(el => {
                // Remover classe primeiro para reiniciar animação
                el.classList.remove('wiggle-animate');
                // Forçar reflow
                void el.offsetWidth;
                // Adicionar classe de animação
                el.classList.add('wiggle-animate');
            });

            // Remover classe após animação terminar
            setTimeout(() => {
                elements.forEach(el => el.classList.remove('wiggle-animate'));
            }, 500);
        };

        // Primeira execução após 3 segundos
        setTimeout(() => {
            triggerWiggle();
            // Depois a cada 5 segundos
            this.wiggleInterval = setInterval(triggerWiggle, 5000);
        }, 3000);
    },

    /**
     * Para a animação de wiggle
     */
    stopWiggleSync: function () {
        if (this.wiggleInterval) {
            clearInterval(this.wiggleInterval);
            this.wiggleInterval = null;
        }
    }
};
