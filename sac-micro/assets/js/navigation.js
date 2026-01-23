/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * navigation.js - Navegação e Menu
 * Gerencia sidebar, menu, progresso e navegação entre páginas
 */

const NavigationManager = {
    app: null, // Referência ao App

    /**
     * Inicializa o gerenciador de navegação
     * @param {Object} appContext - Referência ao objeto App
     */
    init: function (appContext) {
        this.app = appContext;
        this.bindNavigationEvents();
        this.bindSidebarEvents();
    },

    /**
     * Vincula eventos de navegação (prev/next)
     */
    bindNavigationEvents: function () {
        const playClick = () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        };

        const btnNext = document.getElementById('btn-next');
        const btnPrev = document.getElementById('btn-prev');

        if (btnNext) {
            btnNext.onclick = () => {
                // Verificar se está na página intro (index 0) e tutorial não foi feito
                const isIntroPage = this.app.currentIndex === 0;
                const tutorialCompleted = localStorage.getItem('tutorial-completed') === 'true';

                if (isIntroPage && !tutorialCompleted) {
                    // Não permitir avançar - mostrar feedback
                    if (typeof AudioManager !== 'undefined') AudioManager.playError();
                    const startMsg = document.querySelector('.start-message');
                    if (startMsg) {
                        startMsg.style.animation = 'shake 0.5s ease-in-out';
                        setTimeout(() => startMsg.style.animation = '', 500);
                    }
                    return;
                }

                playClick();
                if (this.app.currentIndex < this.app.flatPages.length - 1) {
                    this.app.currentIndex++;
                    this.saveProgress();
                    this.app.loadPage(this.app.currentIndex);
                }
            };
        }

        if (btnPrev) {
            btnPrev.onclick = () => {
                playClick();
                if (this.app.currentIndex > 0) {
                    this.app.currentIndex--;
                    this.saveProgress();
                    this.app.loadPage(this.app.currentIndex);
                }
            };
        }
    },

    /**
     * Vincula eventos do sidebar
     */
    bindSidebarEvents: function () {
        const playClick = () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        };

        const sidebar = document.getElementById('sidebar');
        const toggleSidebar = () => {
            playClick();
            sidebar.classList.toggle('collapsed');
            const btnMenu = document.getElementById('btn-menu');
            if (sidebar.classList.contains('collapsed')) {
                btnMenu.classList.add('active');
                btnMenu.setAttribute('aria-label', 'Abrir Menu');
            } else {
                btnMenu.classList.remove('active');
                btnMenu.setAttribute('aria-label', 'Fechar Menu');
            }
        };

        const toggleBtn = document.getElementById('toggle-sidebar');
        const menuBtn = document.getElementById('btn-menu');

        if (toggleBtn) toggleBtn.onclick = toggleSidebar;
        if (menuBtn) menuBtn.onclick = toggleSidebar;
    },

    /**
     * Renderiza o menu lateral
     */
    renderMenu: function () {
        const menuEl = document.getElementById('menu-content');
        if (!menuEl) return;

        menuEl.innerHTML = "";

        this.app.data.modules.forEach((mod, modIndex) => {
            const group = document.createElement('div');
            group.className = 'module-group';
            group.dataset.moduleId = mod.id;

            // Container for pages (collapsible)
            const pagesContainer = document.createElement('div');
            pagesContainer.className = 'module-pages';

            // Usar tradução do menu.json ou fallback para título do content.json
            const moduleTitle = I18n.t(`menu.modules.${mod.id}`) || mod.title;

            const title = document.createElement('button');
            title.className = 'module-title';
            title.setAttribute('type', 'button');
            title.setAttribute('aria-expanded', 'true');
            title.innerHTML = `
                <span class="module-title-text">${moduleTitle}</span>
                <span class="module-toggle-icon">▼</span>
            `;

            // Toggle collapse/expand on click
            title.onclick = () => {
                const isExpanded = title.getAttribute('aria-expanded') === 'true';
                title.setAttribute('aria-expanded', !isExpanded);
                pagesContainer.classList.toggle('collapsed');
                group.classList.toggle('collapsed');
            };

            group.appendChild(title);

            mod.pages.forEach(page => {
                // Usar tradução do menu.json ou fallback para título do content.json
                const pageTitle = I18n.t(`menu.pages.${page.id}`) || page.title;

                const link = document.createElement('a');
                link.href = "#";
                link.className = 'menu-link locked';
                link.dataset.id = page.id;
                link.dataset.moduleId = mod.id;
                link.textContent = pageTitle;
                link.onclick = (e) => {
                    e.preventDefault();
                    // Find global index
                    const idx = this.app.flatPages.findIndex(p => p.id === page.id);
                    const isExtras = mod.id === 'extras';

                    // Se for página de extras, verificar se está desbloqueada
                    if (isExtras && page.id !== 'extras-hub') {
                        const isUnlocked = GamificationManager.checkExtrasUnlocked(page.id);
                        if (!isUnlocked) {
                            // Mostrar feedback de bloqueio
                            if (typeof AudioManager !== 'undefined') AudioManager.playError();
                            link.classList.add('shake');
                            setTimeout(() => link.classList.remove('shake'), 500);
                            return;
                        }
                    }

                    // Extras são sempre acessíveis (mas não alteram o progresso)
                    if (idx <= this.app.maxIndexReached || isExtras) {
                        this.app.currentIndex = idx;
                        this.app.loadPage(idx);
                        // Só salva progresso se NÃO for extras
                        if (!isExtras) {
                            this.saveProgress();
                        } else {
                            // Apenas atualiza menu visual sem salvar progresso
                            this.updateMenuState();
                        }
                    }
                };
                pagesContainer.appendChild(link);
            });

            group.appendChild(pagesContainer);
            menuEl.appendChild(group);
        });

        this.updateMenuState();
    },

    /**
     * Atualiza estado visual do menu
     */
    updateMenuState: function () {
        const links = document.querySelectorAll('.menu-link');
        links.forEach(link => {
            const pageId = link.dataset.id;
            const idx = this.app.flatPages.findIndex(p => p.id === pageId);
            const pageData = this.app.flatPages[idx];

            link.classList.remove('active', 'locked', 'completed', 'extras-locked');

            if (idx === this.app.currentIndex) {
                link.classList.add('active');
            }

            // Extras são sempre desbloqueados por navegação, MAS podem ter bloqueio de insígnias
            const isExtras = pageData && pageData.moduleId === 'extras';

            if (idx <= this.app.maxIndexReached || isExtras) {
                // Unlocked por progresso
                // Mas verificar se extras está bloqueado por insígnias
                if (isExtras && pageId !== 'extras-hub') {
                    if (!GamificationManager.checkExtrasUnlocked(pageId)) {
                        link.classList.add('extras-locked');
                    }
                }
            } else {
                link.classList.add('locked');
            }

            if (idx < this.app.currentIndex && !isExtras) {
                link.classList.add('completed');
            }
        });

        // Navigation Buttons
        const currentPage = this.app.flatPages[this.app.currentIndex];
        const isExtras = currentPage && currentPage.moduleId === 'extras';
        const navFooter = document.querySelector('.content-nav');

        // Esconder navegação nas páginas de extras
        if (navFooter) {
            if (isExtras) {
                navFooter.style.display = 'none';
            } else {
                navFooter.style.display = '';
                const btnPrev = document.getElementById('btn-prev');
                const btnNext = document.getElementById('btn-next');

                if (btnPrev) btnPrev.disabled = (this.app.currentIndex === 0);

                // Bloquear próximo na página intro até tutorial ser concluído
                const isIntroPage = this.app.currentIndex === 0;
                const tutorialCompleted = localStorage.getItem('tutorial-completed') === 'true';

                if (btnNext) {
                    if (isIntroPage && !tutorialCompleted) {
                        btnNext.disabled = true;
                    } else {
                        btnNext.disabled = (this.app.currentIndex === this.app.flatPages.length - 1);
                    }
                }
            }
        }
    },

    /**
     * Restaura progresso do SCORM
     */
    restoreProgress: function () {
        const location = scorm.getValue("cmi.core.lesson_location");
        console.log("Restoring location:", location);

        if (location) {
            // Find index of the page ID
            const idx = this.app.flatPages.findIndex(p => p.id === location);
            if (idx >= 0) {
                this.app.currentIndex = idx;
                this.app.maxIndexReached = idx;
            }
        }

        // Update Progress Bar
        this.updateProgress();
    },

    /**
     * Salva progresso no SCORM
     */
    saveProgress: function () {
        // Save current page
        const currentPage = this.app.flatPages[this.app.currentIndex];
        scorm.setValue("cmi.core.lesson_location", currentPage.id);

        // Update max index
        if (this.app.currentIndex > this.app.maxIndexReached) {
            this.app.maxIndexReached = this.app.currentIndex;
        }

        // Commit happens in wrapper
        this.updateProgress();
        this.updateMenuState();

        // Check completion based on progress percentage
        this.checkCompletion();
    },

    /**
     * Verifica se o curso atingiu 100% e marca como completed
     * SCORM 1.2: Deve setar status + commit + finish nessa ordem
     */
    checkCompletion: function () {
        const currentPage = this.app.flatPages[this.app.currentIndex];

        // Verificar se a página atual é de conclusão
        if (currentPage && (currentPage.type === 'completion' || currentPage.id === 'encerramento')) {
            scorm.log('Completion page detected. Marking course as completed.');

            // Score consistente (min, max, raw)
            scorm.setValue("cmi.core.score.min", "0");
            scorm.setValue("cmi.core.score.max", "100");
            scorm.setValue("cmi.core.score.raw", "100");

            // Use COMPLETED para máxima compatibilidade
            scorm.setValue("cmi.core.lesson_status", "completed");

            // NÃO chamar scorm.finish() aqui - deixar o usuário continuar navegando
            // A sessão será finalizada automaticamente quando fechar a janela (window.onunload)
            scorm.log('Course marked as completed. User can continue exploring optional content.');
        }
    },

    /**
     * Atualiza barra de progresso
     */
    updateProgress: function () {
        // Contar apenas páginas de módulos (não extras e não intro)
        const modulePages = this.app.flatPages.filter(p => p.type !== 'extras' && p.type !== 'intro');

        // Usar maxIndexReached para não diminuir quando voltar páginas
        const maxPage = this.app.flatPages[this.app.maxIndexReached];
        const maxModuleIndex = maxPage ? modulePages.findIndex(p => p.id === maxPage.id) : -1;

        // Se a página máxima é de extras, encontrar a última página de módulo visitada
        let effectiveMaxIndex = maxModuleIndex;
        if (effectiveMaxIndex < 0) {
            // Procurar a última página de módulo antes do índice máximo
            for (let i = this.app.maxIndexReached; i >= 0; i--) {
                const page = this.app.flatPages[i];
                const modIdx = modulePages.findIndex(p => p.id === page.id);
                if (modIdx >= 0) {
                    effectiveMaxIndex = modIdx;
                    break;
                }
            }
        }

        // Se nenhuma página de módulo foi visitada ainda, progresso = 0
        const percent = (modulePages.length > 0 && effectiveMaxIndex >= 0) ?
            Math.round(((effectiveMaxIndex + 1) / modulePages.length) * 100) : 0;

        const progressBar = document.getElementById('course-progress');
        const progressText = document.getElementById('progress-text');

        if (progressBar) {
            const oldPercent = parseInt(progressBar.value) || 0;
            progressBar.value = percent;

            // Mostrar animação de incremento se houve progresso
            if (percent > oldPercent) {
                const diff = percent - oldPercent;
                this.showProgressIncrement(diff);
            }
        }

        if (progressText) progressText.innerText = percent + "%";

        // Marcações de módulos desativadas\r\n        // this.addModuleMarkers();
    },

    /**
     * Mostra animação de incremento de porcentagem
     */
    showProgressIncrement: function (increment) {
        const progressContainer = document.querySelector('.progress-container') || document.getElementById('course-progress')?.parentElement;
        if (!progressContainer) return;

        // Remover animação anterior se existir
        const existingIncrement = document.getElementById('progress-increment');
        if (existingIncrement) existingIncrement.remove();

        // Criar elemento de incremento
        const incrementEl = document.createElement('div');
        incrementEl.id = 'progress-increment';
        incrementEl.textContent = `+${increment}%`;
        incrementEl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 700;
            font-size: 1.2rem;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
            animation: progressPop 1.5s ease-out forwards;
            z-index: 1000;
            pointer-events: none;
        `;

        progressContainer.style.position = 'relative';
        progressContainer.appendChild(incrementEl);

        // Remover após animação
        setTimeout(() => incrementEl.remove(), 1500);
    },

    /**
     * Adiciona marcações visuais de módulos na barra de progresso
     */
    addModuleMarkers: function () {
        const progressBar = document.getElementById('course-progress');
        if (!progressBar || progressBar.dataset.markersAdded) return;

        const modulePages = this.app.flatPages.filter(p => p.type !== 'extras' && p.type !== 'intro');
        const modules = {};

        // Agrupar páginas por módulo
        modulePages.forEach((page, index) => {
            const moduleMatch = page.id.match(/^m(\d+)/);
            if (moduleMatch) {
                const moduleNum = moduleMatch[1];
                if (!modules[moduleNum]) {
                    modules[moduleNum] = { start: index, end: index };
                } else {
                    modules[moduleNum].end = index;
                }
            }
        });

        // Criar container de marcadores
        const markersContainer = document.createElement('div');
        markersContainer.className = 'progress-markers';
        markersContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;

        // Adicionar marcador para cada módulo (exceto o último)
        const moduleEntries = Object.entries(modules);
        moduleEntries.forEach(([moduleNum, range], index) => {
            // Pular o último módulo, pois o fim da barra já indica o final
            if (index === moduleEntries.length - 1) return;

            const endPercent = Math.round(((range.end + 1) / modulePages.length) * 100);

            const marker = document.createElement('div');
            marker.className = 'module-marker';
            marker.title = `Módulo ${moduleNum}`;
            marker.style.cssText = `
                position: absolute;
                left: ${endPercent}%;
                top: 0;
                width: 2px;
                height: 100%;
                background: rgba(255, 255, 255, 0.5);
                transform: translateX(-50%);
            `;

            markersContainer.appendChild(marker);
        });

        progressBar.parentElement.style.position = 'relative';
        progressBar.parentElement.appendChild(markersContainer);
        progressBar.dataset.markersAdded = 'true';
    }
};
