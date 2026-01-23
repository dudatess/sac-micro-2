/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * accessibility.js - Recursos de Acessibilidade
 * Gerencia dark mode, fonte, dislexia, TTS e idioma
 */

const AccessibilityManager = {
    // TTS State
    speaking: false,
    ttsSpeed: 1.0,
    ttsVolume: 1.0,
    selectedVoice: null,
    availableVoices: [],
    autoReadEnabled: false,

    // Reading State (for segmented/interactive reading)
    readingState: {
        isReading: false,
        segments: [],              // Array of {type, content, element}
        currentSegmentIndex: 0,
        waitingForInteraction: false,
        interactiveElements: [],   // Elements waiting for interaction
        interactedElements: new Set() // Track which elements were clicked
    },

    // Font State
    fontSize: 100,

    // References
    ttsBtn: null,
    ttsControls: null,

    /**
     * Inicializa todos os recursos de acessibilidade
     */
    init: function () {
        // Auto-read desabilitado por padrão (restrição do navegador), mas respeita preferência do usuário
        const savedPreference = localStorage.getItem('auto-read');
        this.autoReadEnabled = savedPreference !== null ? savedPreference === 'true' : false;

        this.initSettingsModal();
        this.initDarkMode();
        this.initFontSize();
        this.initDyslexiaMode();
        this.initTTS();
        this.initLanguage();
    },

    /**
     * Lê o texto de um elemento específico (para pop-ups, toggles, etc)
     * Interrompe a leitura atual se houver
     * @param {HTMLElement|string} elementOrText - Elemento DOM ou texto direto
     */
    speakElement: function (elementOrText) {
        // Verificar se é um elemento interativo que deve sempre ser lido
        const isInteractiveElement = typeof elementOrText === 'object' && elementOrText.nodeType && (
            elementOrText.classList?.contains('modal-body') ||
            elementOrText.classList?.contains('modal-content') ||
            elementOrText.classList?.contains('reveal-content') ||
            elementOrText.classList?.contains('interactive-card-content') ||
            elementOrText.classList?.contains('flip-card-back') ||
            elementOrText.classList?.contains('qa-answer') ||
            elementOrText.classList?.contains('accordion-content') ||
            elementOrText.closest?.('.modal-overlay') ||
            elementOrText.closest?.('.reveal-container') ||
            elementOrText.closest?.('.flip-card') ||
            elementOrText.closest?.('.accordion')
        );

        // Permitir leitura se:
        // 1. Auto-read está ativo (mesmo que não esteja falando no momento)
        // 2. Está falando atualmente (modo manual)
        // 3. É um elemento interativo e auto-read está habilitado
        if (!this.autoReadEnabled && !this.speaking && !isInteractiveElement) return;

        const currentLang = typeof App !== 'undefined' ? App.currentLang : 'pt';

        // Cancelar leitura atual
        window.speechSynthesis.cancel();

        // Obter texto
        let text;
        if (typeof elementOrText === 'string') {
            text = this.getReadableText(elementOrText);
        } else if (elementOrText && elementOrText.nodeType) {
            text = this.getStructuredText(elementOrText);
        } else {
            return;
        }

        if (!text || text.trim() === '') return;

        // Criar e falar
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'es' ? 'es-ES' : currentLang === 'fr' ? 'fr-FR' : 'en-US';
        utterance.rate = this.ttsSpeed;
        utterance.volume = this.ttsVolume;
        if (this.selectedVoice) utterance.voice = this.selectedVoice;

        window.speechSynthesis.speak(utterance);
        this.speaking = true;

        if (this.ttsBtn) {
            this.ttsBtn.classList.add('active', 'tts-playing');
            if (this.autoReadEnabled) this.ttsBtn.classList.add('tts-playing');
        }

        utterance.onend = () => {
            this.speaking = false;
            if (this.ttsBtn) {
                this.ttsBtn.classList.remove('tts-playing');
                if (this.autoReadEnabled) {
                    this.ttsBtn.classList.remove('tts-playing');
                } else {
                    this.ttsBtn.classList.remove('active');
                }
            }
        };
    },

    /**
     * Inicializa modal de configurações
     */
    initSettingsModal: function () {
        const settingsBtn = document.getElementById('btn-settings');
        const settingsModal = document.getElementById('modal-settings');
        const settingsClose = document.getElementById('btn-settings-close');

        if (settingsBtn) {
            settingsBtn.onclick = () => {
                settingsModal.classList.add('active');
                if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            };
        }

        if (settingsClose) {
            settingsClose.onclick = () => {
                settingsModal.classList.remove('active');
                if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            };
        }

        // Close modal when clicking outside
        if (settingsModal) {
            settingsModal.onclick = (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.remove('active');
                }
            };
        }
    },

    /**
     * Inicializa modo escuro (dark mode)
     */
    initDarkMode: function () {
        const contrastBtn = document.getElementById('btn-contrast');
        if (contrastBtn) {
            contrastBtn.onclick = () => {
                document.body.classList.toggle('high-contrast');
                contrastBtn.classList.toggle('active');
                if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            };
        }
    },

    /**
     * Inicializa controle de tamanho de fonte
     */
    initFontSize: function () {
        const fontSizeDisplay = document.getElementById('font-size-display');
        const increaseBtn = document.getElementById('btn-increase-font');
        const decreaseBtn = document.getElementById('btn-decrease-font');

        if (increaseBtn) {
            increaseBtn.onclick = () => {
                if (this.fontSize < 150) {
                    this.fontSize += 10;
                    document.documentElement.style.fontSize = (this.fontSize / 100 * 16) + "px";
                    if (fontSizeDisplay) fontSizeDisplay.textContent = this.fontSize + '%';
                    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                }
            };
        }

        if (decreaseBtn) {
            decreaseBtn.onclick = () => {
                if (this.fontSize > 70) {
                    this.fontSize -= 10;
                    document.documentElement.style.fontSize = (this.fontSize / 100 * 16) + "px";
                    if (fontSizeDisplay) fontSizeDisplay.textContent = this.fontSize + '%';
                    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                }
            };
        }
    },

    /**
     * Inicializa modo de assistência à leitura (dislexia)
     */
    initDyslexiaMode: function () {
        const dyslexiaBtn = document.getElementById('btn-dyslexia');
        if (dyslexiaBtn) {
            dyslexiaBtn.onclick = () => {
                document.body.classList.toggle('dyslexia-mode');
                dyslexiaBtn.classList.toggle('active');
                if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            };
        }
    },

    /**
     * Inicializa Text-to-Speech
     */
    initTTS: function () {
        this.ttsBtn = document.getElementById('btn-tts');
        this.ttsControls = document.getElementById('tts-controls');
        const volumeRange = document.getElementById('volume-range');
        const autoReadBtn = document.getElementById('btn-auto-read');
        const voiceSelect = document.getElementById('voice-select');
        const voicePreviewBtn = document.getElementById('btn-voice-preview');

        // Restaurar estado do auto-read
        if (this.autoReadEnabled && autoReadBtn) {
            autoReadBtn.classList.add('active');
            if (this.ttsControls) this.ttsControls.classList.add('auto-read-mode');
            if (this.ttsBtn) {
                this.ttsBtn.title = 'Pausar/Continuar Leitura';
            }
        }

        // Auto-read toggle
        if (autoReadBtn) {
            autoReadBtn.onclick = () => {
                this.autoReadEnabled = !this.autoReadEnabled;
                autoReadBtn.classList.toggle('active');
                localStorage.setItem('auto-read', this.autoReadEnabled);
                if (typeof AudioManager !== 'undefined') AudioManager.playClick();

                if (this.autoReadEnabled) {
                    if (this.ttsControls) this.ttsControls.classList.add('auto-read-mode');
                    if (this.ttsBtn) {
                        this.ttsBtn.classList.add('active');
                        this.ttsBtn.title = 'Pausar/Continuar Leitura';
                    }
                    this.startAutoRead();
                } else {
                    if (this.ttsControls) this.ttsControls.classList.remove('auto-read-mode');
                    if (this.ttsBtn) {
                        this.ttsBtn.classList.remove('active');
                        this.ttsBtn.title = 'Ler Página';
                    }
                    window.speechSynthesis.cancel();
                    this.speaking = false;
                    if (this.ttsBtn) this.ttsBtn.classList.remove('active', 'tts-playing');
                }
            };
        }

        // Volume control
        if (volumeRange) {
            volumeRange.oninput = () => {
                this.ttsVolume = volumeRange.value / 100;
                if (this.speaking) {
                    this.restartSpeech();
                }
            };
        }

        // Speed Buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.ttsSpeed = parseFloat(btn.dataset.speed);
                if (typeof AudioManager !== 'undefined') AudioManager.playClick();

                if (this.speaking) {
                    this.restartSpeech();
                }
            };
        });

        // Voice Selector
        this.loadVoices();
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();

        if (voiceSelect) {
            voiceSelect.onchange = () => {
                this.selectedVoice = this.availableVoices.find(v => v.name === voiceSelect.value);
                localStorage.setItem('tts-voice', voiceSelect.value);
            };
        }

        if (voicePreviewBtn) {
            voicePreviewBtn.onclick = () => {
                this.previewVoice();
            };
        }

        // TTS Button
        if (this.ttsBtn) {
            this.ttsBtn.onclick = () => {
                this.handleTTSButtonClick();
            };
        }
    },

    /**
     * Carrega vozes disponíveis
     */
    loadVoices: function () {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect) return;

        this.availableVoices = window.speechSynthesis.getVoices();
        if (this.availableVoices.length > 0) {
            voiceSelect.innerHTML = '';

            const currentLang = typeof App !== 'undefined' ? App.currentLang : 'pt';
            const langFilter = currentLang === 'pt' ? 'pt' : currentLang === 'es' ? 'es' : currentLang === 'fr' ? 'fr' : 'en';

            const filteredVoices = this.availableVoices.filter(v => v.lang.toLowerCase().startsWith(langFilter));
            const otherVoices = this.availableVoices.filter(v => !v.lang.toLowerCase().startsWith(langFilter));

            filteredVoices.forEach((voice) => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                if (voice.name.includes('Google')) option.textContent += ' ⭐';
                voiceSelect.appendChild(option);
            });

            if (filteredVoices.length > 0 && otherVoices.length > 0) {
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = I18n.t('tts.other_voices') || '── Other voices ──';
                voiceSelect.appendChild(separator);
            }

            otherVoices.forEach((voice) => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });

            // Verificar se há voz salva
            const savedVoice = localStorage.getItem('tts-voice');
            if (savedVoice && this.availableVoices.find(v => v.name === savedVoice)) {
                voiceSelect.value = savedVoice;
                this.selectedVoice = this.availableVoices.find(v => v.name === savedVoice);
            } else {
                // Auto-selecionar voz Google como preset se disponível
                const googleVoice = filteredVoices.find(v => v.name.includes('Google'));
                if (googleVoice) {
                    voiceSelect.value = googleVoice.name;
                    this.selectedVoice = googleVoice;
                    localStorage.setItem('tts-voice', googleVoice.name);
                } else if (filteredVoices.length > 0) {
                    voiceSelect.value = filteredVoices[0].name;
                    this.selectedVoice = filteredVoices[0];
                }
            }
        }
    },

    /**
     * Preview da voz selecionada
     */
    previewVoice: function () {
        const voiceSelect = document.getElementById('voice-select');
        const currentLang = typeof App !== 'undefined' ? App.currentLang : 'pt';

        window.speechSynthesis.cancel();
        const testText = currentLang === 'pt'
            ? 'Olá! Esta é uma prévia da voz.'
            : currentLang === 'es'
                ? 'Hola! Esta es una vista previa.'
                : currentLang === 'fr'
                    ? 'Bonjour! Ceci est un aperçu de la voix.'
                    : 'Hello! This is a voice preview.';

        const utterance = new SpeechSynthesisUtterance(testText);
        const voice = this.availableVoices.find(v => v.name === voiceSelect.value);
        if (voice) utterance.voice = voice;
        utterance.rate = this.ttsSpeed;
        utterance.volume = this.ttsVolume;
        window.speechSynthesis.speak(utterance);
    },

    /**
     * Limpa o texto para leitura (remove emojis e símbolos gráficos)
     * @param {string} text 
     * @returns {string} 
     */
    getReadableText: function (text) {
        if (!text) return "";

        // Regex para remover emojis e símbolos diversos
        // Faixas Unicode comuns para Emojis e Símbolos
        return text
            .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '')
            .replace(/[►◀▶️⏸️🔊✎✅❌⚠️💡🏆🧩🔍🎭📋🛡️⚡⭐]/g, '') // Emojis específicos usados na interface
            .replace(/\(([^)]+)\)/g, ', $1,') // Normalizar parênteses: (texto) → , texto, (evita pausas)
            .replace(/\s+/g, ' ') // Normalizar espaços extra
            .trim();
    },

    /**
     * Extrai texto do conteúdo de forma estruturada, adicionando pausas e contexto para TTS
     * @param {HTMLElement} container - Elemento container do conteúdo
     * @returns {string} - Texto preparado para TTS com pausas apropriadas
     */
    getStructuredText: function (container) {
        if (!container) return "";

        const textParts = [];
        const self = this;

        // Ordinais para listas numeradas (via i18n)
        const ordinals = I18n.t('tts.ordinals') || ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];

        /**
         * Processa um elemento e seus filhos recursivamente
         */
        function processElement(element, context = {}) {
            if (!element) return;

            const tagName = element.tagName;

            // Ignorar elementos não desejados
            const skipTags = ['SCRIPT', 'STYLE', 'NAV', 'FOOTER', 'INPUT', 'SELECT', 'TEXTAREA'];
            if (skipTags.includes(tagName)) return;

            // Ignorar modais e sidebar
            if (element.closest('.modal-overlay') || element.closest('#sidebar')) return;

            // Ignorar elementos ocultos (exceto BODY)
            if (element.offsetParent === null && tagName !== 'BODY' && tagName !== 'HTML') return;

            // === ACORDEÕES FECHADOS: Ignorar conteúdo de <details> que não está aberto ===
            if (tagName === 'DETAILS' && !element.hasAttribute('open')) {
                // Ler apenas o summary se existir
                const summary = element.querySelector('summary');
                if (summary) {
                    const summaryText = self.getReadableText(summary.textContent);
                    if (summaryText) {
                        textParts.push(summaryText + '.');
                    }
                }
                return; // Não processar o conteúdo interno
            }

            // === CARDS INTERATIVOS ===
            if (element.classList.contains('interactive-cards') || element.classList.contains('premium-cards-grid')) {
                const cards = element.querySelectorAll('.interactive-card, .premium-card');
                const totalCards = cards.length;

                cards.forEach((card, index) => {
                    if (totalCards > 1) {
                        textParts.push(`Card ${index + 1} de ${totalCards}.`);
                    }

                    // Ler header do card
                    const header = card.querySelector('.interactive-card-header span:not(.icon), .premium-card h3');
                    if (header) {
                        const headerText = self.getReadableText(header.textContent);
                        if (headerText) textParts.push(headerText + '.');
                    }

                    // Ler conteúdo do card
                    const content = card.querySelector('.interactive-card-content p, .premium-card p');
                    if (content) {
                        const contentText = self.getReadableText(content.textContent);
                        if (contentText) textParts.push(contentText);
                    }
                });
                return; // Já processamos os cards
            }

            // === SLIDERS DE CONTEÚDO ===
            if (element.classList.contains('content-slider')) {
                const slides = element.querySelectorAll('.slider-slide');

                if (slides.length > 0) {
                    textParts.push(I18n.t('tts.step_by_step') || 'Step by step.');

                    slides.forEach((slide, index) => {
                        // Ler TODOS os slides, mesmo os ocultos (class 'hidden')
                        const title = slide.querySelector('h5');
                        const text = slide.querySelector('p');

                        if (title) {
                            const titleText = self.getReadableText(title.textContent);
                            if (titleText) textParts.push(`${I18n.t('tts.step') || 'Step'} ${index + 1}. ${titleText}`);
                        }
                        if (text) {
                            const textContent = self.getReadableText(text.textContent);
                            if (textContent) textParts.push(textContent);
                        }
                    });
                }
                return; // Já processamos o slider
            }

            // === QUIZ BLOCK ===
            if (element.classList.contains('quiz-block')) {
                const question = element.querySelector('.question');
                if (question) {
                    textParts.push(I18n.t('tts.question') || 'Question.');
                    const questionText = self.getReadableText(question.textContent);
                    if (questionText) textParts.push(questionText);
                }

                // Ler opções de quiz
                const options = element.querySelectorAll('.quiz-option');
                options.forEach((option, index) => {
                    const optionText = self.getReadableText(option.textContent);
                    if (optionText) textParts.push(optionText);
                });
                return;
            }

            // === HIGHLIGHT BOXES ===
            if (element.classList.contains('highlight-box') || element.classList.contains('box-attention')) {
                let intro = '';

                if (element.classList.contains('atencao') || element.classList.contains('box-attention')) {
                    intro = I18n.t('tts.attention') || 'Attention.';
                } else if (element.classList.contains('dica')) {
                    intro = I18n.t('tts.tip') || 'Tip.';
                } else if (element.classList.contains('sabia')) {
                    intro = I18n.t('tts.did_you_know') || 'Did you know?';
                } else {
                    intro = I18n.t('tts.important') || 'Important.';
                }

                textParts.push(intro);

                const content = element.querySelector('.highlight-box-content, p');
                if (content) {
                    const contentText = self.getReadableText(content.textContent);
                    if (contentText) textParts.push(contentText);
                }
                return;
            }

            // === TÍTULOS (H1-H6) ===
            if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) {
                const headingText = self.getReadableText(element.textContent);
                if (headingText) {
                    textParts.push(headingText + '.');
                }
                return;
            }

            // === LISTAS ORDENADAS ===
            if (tagName === 'OL') {
                const items = element.querySelectorAll(':scope > li');
                items.forEach((item, index) => {
                    const ordinal = ordinals[index] || `Item ${index + 1}`;
                    const itemText = self.getReadableText(item.textContent);
                    if (itemText) {
                        textParts.push(`${ordinal}. ${itemText}`);
                    }
                });
                return;
            }

            // === LISTAS NÃO ORDENADAS ===
            if (tagName === 'UL') {
                const items = element.querySelectorAll(':scope > li');
                items.forEach((item) => {
                    const itemText = self.getReadableText(item.textContent);
                    if (itemText) textParts.push(itemText);
                });
                return;
            }

            // === PARÁGRAFOS ===
            if (tagName === 'P') {
                const pText = self.getReadableText(element.textContent);
                if (pText) textParts.push(pText);
                return;
            }

            // === SUMMARY (em details aberto) ===
            if (tagName === 'SUMMARY') {
                const summaryText = self.getReadableText(element.textContent);
                if (summaryText) textParts.push(summaryText + '.');
                return;
            }

            // === BOTÕES DE NAVEGAÇÃO (ignorar) ===
            if (tagName === 'BUTTON') {
                return;
            }

            // === PROCESSAR FILHOS RECURSIVAMENTE ===
            const children = element.children;
            for (let i = 0; i < children.length; i++) {
                processElement(children[i], context);
            }
        }

        // Iniciar processamento
        const contentArea = container.querySelector('#content-area') || container;
        processElement(contentArea);

        // Juntar todas as partes
        let result = textParts.join(' ');

        // Normalizar espaços múltiplos
        result = result.replace(/\s+/g, ' ').trim();

        // Garantir pontuação no final de frases
        result = result.replace(/([a-záéíóúâêôãõç])(\s+[A-Z])/g, '$1.$2');

        return result;
    },

    /**
     * Segmenta o conteúdo da página em blocos de texto e elementos interativos
     * @param {HTMLElement} container - Container principal
     * @returns {Array} - Array de segmentos {type, content, element, elements}
     */
    getContentSegments: function (container) {
        const segments = [];
        const contentArea = container.querySelector('#content-area') || container;

        // Função auxiliar para adicionar texto acumulado
        let textBuffer = [];
        const flushTextBuffer = () => {
            if (textBuffer.length > 0) {
                const text = textBuffer.join(' ').replace(/\s+/g, ' ').trim();
                if (text) {
                    segments.push({
                        type: 'text',
                        content: text
                    });
                }
                textBuffer = [];
            }
        };

        // Processar filhos diretos do content-area
        const processChildren = (parent) => {
            Array.from(parent.children).forEach(child => {
                // Ignorar elementos ocultos e não desejados
                if (child.offsetParent === null && child.tagName !== 'DETAILS') return;
                if (child.classList.contains('modal-overlay')) return;

                const tagName = child.tagName;

                // === CARDS INTERATIVOS ===
                if (child.classList.contains('interactive-cards') || child.classList.contains('premium-cards-grid')) {
                    flushTextBuffer(); // Salvar texto anterior

                    const cards = child.querySelectorAll('.interactive-card, .premium-card');
                    if (cards.length > 0) {
                        // Verificar se os cards são realmente interativos (têm conteúdo colapsável)
                        // Cards na página de boas-vindas não têm classe 'expanded', então não são interativos
                        const hasInteractiveCards = Array.from(cards).some(card => {
                            // Se o card tem onclick ou pode ser expandido, é interativo
                            return card.onclick || card.classList.contains('expandable');
                        });

                        if (hasInteractiveCards) {
                            // Cards interativos - criar breakpoint
                            segments.push({
                                type: 'text',
                                content: I18n.t('tts.interactive_cards', { count: cards.length }) || `There are ${cards.length} interactive cards. Click each to explore the content.`
                            });

                            segments.push({
                                type: 'interactive-breakpoint',
                                elements: Array.from(cards),
                                waitMessage: I18n.t('tts.waiting_interaction') || 'Waiting for interaction with cards.'
                            });
                        } else {
                            // Cards não-interativos - ler normalmente
                            const text = this.getStructuredText(child);
                            if (text) {
                                segments.push({
                                    type: 'text',
                                    content: text
                                });
                            }
                        }
                    }
                    return;
                }

                // === ACCORDIONS (Q&A Resumo) ===
                if (child.classList.contains('accordion')) {
                    flushTextBuffer();

                    const accordionItems = child.querySelectorAll('details');
                    if (accordionItems.length > 0) {
                        // Anunciar quantos itens há
                        segments.push({
                            type: 'text',
                            content: I18n.t('tts.accordion_items', { count: accordionItems.length }) || `There are ${accordionItems.length} items to explore. Click each one.`
                        });

                        // Adicionar breakpoint para os accordions
                        segments.push({
                            type: 'interactive-breakpoint',
                            elements: Array.from(accordionItems),
                            waitMessage: I18n.t('tts.waiting_explore') || 'Waiting for you to explore the items.'
                        });
                    }
                    return;
                }

                // === FLIP CARDS (Você Sabia?) ===
                if (child.classList.contains('flip-card')) {
                    flushTextBuffer();

                    if (!child.classList.contains('flipped')) {
                        // Ler título da frente
                        const frontTitle = child.querySelector('.flip-card-front h4');
                        if (frontTitle) {
                            const titleText = this.getReadableText(frontTitle.textContent);
                            segments.push({
                                type: 'text',
                                content: titleText + '. ' + (I18n.t('tts.click_to_reveal') || 'Click to reveal.')
                            });
                        }

                        // Adicionar breakpoint
                        segments.push({
                            type: 'interactive-breakpoint',
                            elements: [child],
                            waitMessage: I18n.t('tts.waiting_click_card') || 'Waiting for you to click the card.'
                        });
                    }
                    return;
                }

                // === BOTÕES DE REVELAR ===
                if (child.classList.contains('reveal-container')) {
                    flushTextBuffer();

                    const btn = child.querySelector('.reveal-btn');
                    if (btn && !btn.classList.contains('revealed')) {
                        segments.push({
                            type: 'text',
                            content: I18n.t('tts.additional_content') || 'There is additional content available. Click to reveal.'
                        });

                        segments.push({
                            type: 'interactive-breakpoint',
                            elements: [btn],
                            waitMessage: I18n.t('tts.waiting_reveal') || 'Waiting for content reveal.'
                        });
                    }
                    return;
                }

                // === SLIDERS ===
                if (child.classList.contains('content-slider')) {
                    flushTextBuffer();

                    const slides = child.querySelectorAll('.slider-slide');
                    if (slides.length > 0) {
                        // Anunciar slider
                        segments.push({
                            type: 'text',
                            content: I18n.t('tts.slider_steps', { count: slides.length }) || `Step by step with ${slides.length} stages. Use the arrows to navigate.`
                        });

                        // Criar breakpoint especial para slider
                        segments.push({
                            type: 'slider-breakpoint',
                            element: child,
                            slides: Array.from(slides),
                            waitMessage: I18n.t('tts.interact_slider') || 'Interact with the slider below.'
                        });
                    }
                    return;
                }

                // === QUIZ BLOCKS ===
                if (child.classList.contains('quiz-block')) {
                    flushTextBuffer();

                    // Ler apenas a pergunta
                    const question = child.querySelector('.question');
                    if (question) {
                        segments.push({
                            type: 'text',
                            content: question.textContent + ' ' + (I18n.t('tts.answer_to_continue') || 'Answer to continue.')
                        });
                    }

                    // Criar breakpoint para aguardar resposta correta
                    segments.push({
                        type: 'quiz-breakpoint',
                        element: child,
                        waitMessage: I18n.t('tts.waiting_quiz_answer') || 'Waiting for you to answer the quiz.'
                    });
                    return;
                }

                // === HIGHLIGHT BOXES ===
                if (child.classList.contains('highlight-box') || child.classList.contains('box-attention')) {
                    flushTextBuffer();
                    const text = this.getStructuredText(child);
                    if (text) {
                        segments.push({
                            type: 'text',
                            content: text
                        });
                    }
                    return;
                }

                // === CARD-CONCEPT BOXES (Prazos, Conceitos, etc.) ===
                if (child.classList.contains('card-concept')) {
                    flushTextBuffer();
                    const text = this.getStructuredText(child);
                    if (text) {
                        segments.push({
                            type: 'text',
                            content: text
                        });
                    }
                    return;
                }

                // === TÍTULOS ===
                if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) {
                    flushTextBuffer();
                    const text = this.getReadableText(child.textContent);
                    if (text) {
                        segments.push({
                            type: 'text',
                            content: text + '.'
                        });
                    }
                    return;
                }

                // === PARÁGRAFOS E LISTAS ===
                if (['P', 'UL', 'OL'].includes(tagName)) {
                    const text = this.getReadableText(child.textContent);
                    if (text) textBuffer.push(text);
                    return;
                }

                // === PROCESSAR FILHOS RECURSIVAMENTE ===
                if (child.children.length > 0) {
                    processChildren(child);
                }
            });
        };

        processChildren(contentArea);
        flushTextBuffer(); // Salvar qualquer texto restante

        return segments;
    },

    /**
     * Inicia leitura automática da página
     */
    startAutoRead: function () {
        if (!this.autoReadEnabled) return;

        const container = document.getElementById('main-content');

        // Resetar estado de leitura
        this.readingState.isReading = true;
        this.readingState.currentSegmentIndex = 0;
        this.readingState.waitingForInteraction = false;
        this.readingState.interactedElements.clear();

        // Segmentar conteúdo
        this.readingState.segments = this.getContentSegments(container);

        console.log('[TTS] Segmentos criados:', this.readingState.segments.length);

        // Iniciar leitura do primeiro segmento
        this.speakNextSegment();
    },

    /**
     * Lê o próximo segmento da fila
     */
    speakNextSegment: function () {
        const state = this.readingState;

        // Verificar se ainda há segmentos
        if (state.currentSegmentIndex >= state.segments.length) {
            console.log('[TTS] Leitura completa!');
            this.stopReading();
            return;
        }

        const segment = state.segments[state.currentSegmentIndex];
        console.log(`[TTS] Segmento ${state.currentSegmentIndex + 1}/${state.segments.length}:`, segment.type);

        if (segment.type === 'text') {
            // Segmento de texto normal - ler e continuar
            this.speakText(segment.content, () => {
                state.currentSegmentIndex++;
                this.speakNextSegment();
            });

        } else if (segment.type === 'interactive-breakpoint') {
            // Breakpoint - pausar e aguardar interação
            state.waitingForInteraction = true;
            state.interactiveElements = segment.elements;

            // Adicionar indicadores visuais
            segment.elements.forEach(el => {
                el.classList.add('tts-waiting');
            });

            // Anunciar que está aguardando
            this.speakText(segment.waitMessage, () => {
                console.log('[TTS] Aguardando interação com', segment.elements.length, 'elementos');
                // Não avançar - aguardar interação
            });

        } else if (segment.type === 'slider-breakpoint') {
            // Slider - ler primeiro passo e aguardar navegação
            state.waitingForInteraction = true;
            state.sliderElement = segment.element;
            state.sliderCurrentStep = 0;
            state.sliderTotalSteps = segment.slides.length;

            // Adicionar indicador visual no slider
            segment.element.classList.add('tts-waiting');

            // Ler primeiro passo
            const firstSlide = segment.slides[0];
            if (firstSlide) {
                const text = this.getStructuredText(firstSlide);
                this.speakText(text, () => {
                    console.log('[TTS] Aguardando navegação no slider');
                    // Não avançar - aguardar navegação
                });
            }
        } else if (segment.type === 'quiz-breakpoint') {
            // Quiz - aguardar resposta correta
            state.waitingForInteraction = true;
            state.quizElement = segment.element;

            // Adicionar indicador visual no quiz
            segment.element.classList.add('tts-waiting');

            // Anunciar que está aguardando
            this.speakText(segment.waitMessage, () => {
                console.log('[TTS] Aguardando resposta correta do quiz');
                // Não avançar - aguardar resposta correta
            });
        }
    },

    /**
     * Fala um texto e chama callback ao terminar
     * @param {string} text - Texto para falar
     * @param {Function} onEnd - Callback ao terminar
     */
    speakText: function (text, onEnd) {
        const currentLang = typeof App !== 'undefined' ? App.currentLang : 'pt';

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang === 'pt' ? 'pt-BR' : currentLang === 'es' ? 'es-ES' : currentLang === 'fr' ? 'fr-FR' : 'en-US';
        utterance.rate = this.ttsSpeed;
        utterance.volume = this.ttsVolume;
        if (this.selectedVoice) utterance.voice = this.selectedVoice;

        window.speechSynthesis.speak(utterance);
        this.speaking = true;

        if (this.ttsBtn) {
            this.ttsBtn.classList.add('active', 'tts-playing');
            if (this.autoReadEnabled) {
                this.ttsBtn.classList.add('tts-playing');
            }
        }

        utterance.onend = () => {
            this.speaking = false;
            if (this.ttsBtn && !this.readingState.waitingForInteraction) {
                this.ttsBtn.classList.remove('tts-playing');
                if (this.autoReadEnabled) {
                    this.ttsBtn.classList.remove('tts-playing');
                } else if (!this.readingState.isReading) {
                    // Modo manual: remover 'active' apenas se leitura terminou completamente
                    this.ttsBtn.classList.remove('active');
                }
            }
            if (onEnd) onEnd();
        };
    },

    /**
     * Para completamente a leitura
     */
    stopReading: function () {
        window.speechSynthesis.cancel();
        this.speaking = false;
        this.readingState.isReading = false;
        this.readingState.waitingForInteraction = false;

        // Remover indicadores visuais
        document.querySelectorAll('.tts-waiting').forEach(el => {
            el.classList.remove('tts-waiting');
        });

        if (this.ttsBtn) {
            this.ttsBtn.classList.remove('active', 'tts-playing');
            if (this.autoReadEnabled) {
                this.ttsBtn.classList.remove('tts-playing');
            }
        }
    },

    /**
     * Chamado quando usuário interage com elemento interativo
     * @param {HTMLElement} element - Elemento que foi clicado
     */
    onInteractiveElementClicked: function (element) {
        const state = this.readingState;

        if (!state.waitingForInteraction) return;

        // Marcar como interagido
        state.interactedElements.add(element);
        element.classList.remove('tts-waiting');

        console.log(`[TTS] Elemento interagido: ${state.interactedElements.size}/${state.interactiveElements.length}`);

        // Verificar se todos os elementos foram interagidos
        const allInteracted = state.interactiveElements.every(el =>
            state.interactedElements.has(el)
        );

        if (allInteracted) {
            console.log('[TTS] Todos os elementos interagidos! Aguardando leitura do último elemento...');

            // Remover indicadores visuais restantes
            state.interactiveElements.forEach(el => {
                el.classList.remove('tts-waiting');
            });

            // Continuar para próximo segmento
            state.waitingForInteraction = false;
            state.currentSegmentIndex++;

            // IMPORTANTE: Aguardar a leitura do último elemento terminar
            // Verificar periodicamente se ainda está falando
            const checkAndContinue = () => {
                if (this.speaking) {
                    // Ainda está lendo o último elemento, aguardar mais
                    setTimeout(checkAndContinue, 200);
                } else {
                    // Terminou de ler, continuar
                    console.log('[TTS] Leitura do último elemento concluída. Continuando...');
                    setTimeout(() => {
                        this.speakNextSegment();
                    }, 500);
                }
            };

            // CRÍTICO: Aguardar tempo mínimo para o speakElement ser chamado
            // (especialmente importante para flip cards que têm delay de 400ms)
            setTimeout(checkAndContinue, 600);
        }
    },

    /**
     * Reinicia speech com configurações atuais (DEPRECATED - usar startAutoRead)
     */
    restartSpeech: function () {
        // Usar sistema de segmentos
        if (this.autoReadEnabled) {
            this.startAutoRead();
        }
    },

    /**
     * Handler do botão TTS principal - Toggle simples
     */
    handleTTSButtonClick: function () {
        // Toggle auto-read on/off
        this.autoReadEnabled = !this.autoReadEnabled;
        localStorage.setItem('auto-read', this.autoReadEnabled);

        if (this.autoReadEnabled) {
            // Ativar leitura
            if (this.ttsBtn) {
                this.ttsBtn.classList.add('active');
            }
            // Iniciar leitura da página atual
            this.startAutoRead();
        } else {
            // Desativar leitura
            this.stopReading();
            if (this.ttsBtn) {
                this.ttsBtn.classList.remove('active', 'tts-playing');
            }
        }
    },

    /**
     * Inicializa seletor de idioma
     */
    initLanguage: function () {
        const languages = ['pt', 'es', 'fr', 'en'];

        languages.forEach(lang => {
            const btn = document.getElementById(`btn-lang-${lang}`);
            if (btn) {
                btn.onclick = async () => {
                    if (typeof App !== 'undefined' && App.currentLang !== lang) {
                        App.currentLang = lang;
                        await I18n.setLanguage(lang);
                        this.updateLangButtons(lang);
                        App.loadPage(App.currentIndex);
                        App.renderMenu();
                        this.loadVoices();
                        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                    }
                };
            }
        });

        // Set initial active button
        const currentLang = (typeof I18n !== 'undefined' && I18n.currentLang) ? I18n.currentLang : 'pt';
        this.updateLangButtons(currentLang);
    },

    /**
     * Atualiza estado dos botões de idioma
     */
    updateLangButtons: function (activeLang) {
        ['pt', 'es', 'fr', 'en'].forEach(lang => {
            const btn = document.getElementById(`btn-lang-${lang}`);
            if (btn) {
                if (lang === activeLang) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }
};
