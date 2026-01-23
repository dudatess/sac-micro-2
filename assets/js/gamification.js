/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * gamification.js - Sistema de Gamificação
 * Gerencia medalhas, badges e desbloqueio de conteúdo extra
 */

const GamificationManager = {
    /**
     * Atualiza estado dos cards de Fixação baseado nas insígnias conquistadas
     */
    updateFixacaoCards: function () {
        const badges = JSON.parse(localStorage.getItem('badges') || '{}');
        const fixacaoCards = document.querySelectorAll('.fixacao-card');

        if (fixacaoCards.length === 0) return;

        // Contar insígnias por tipo
        const count = {
            resumo: 0,
            video: 0,
            quiz: 0,
            flashcard: 0,
            'drag-drop': 0,
            'find-error': 0,
            'roleplay': 0
        };

        // Contar quantas insígnias de cada tipo o usuário tem
        Object.values(badges).forEach(moduleBadges => {
            if (Array.isArray(moduleBadges)) {
                moduleBadges.forEach(badge => {
                    if (count.hasOwnProperty(badge)) {
                        count[badge]++;
                    }
                });
            }
        });

        // Atualizar cada card
        fixacaoCards.forEach(card => {
            const type = card.dataset.type;
            const required = parseInt(card.dataset.required) || 1;
            const currentCount = count[type] || 0;

            // Atualizar ícones individuais
            const badgeIcons = card.querySelectorAll('.badge-icon');
            badgeIcons.forEach(icon => {
                const moduleNum = parseInt(icon.dataset.module);
                if (badges['m' + moduleNum] && badges['m' + moduleNum].includes(type)) {
                    icon.classList.add('earned');
                }
            });

            // Verificar se está desbloqueado
            if (currentCount >= required) {
                card.classList.remove('locked');
                card.classList.add('unlocked');
            }
        });
    },

    /**
     * Verifica se uma página de extras está desbloqueada baseado nas medalhas
     * @param {string} pageId - ID da página a verificar
     * @returns {boolean} - Se está desbloqueada
     */
    checkExtrasUnlocked: function (pageId) {
        const badges = JSON.parse(localStorage.getItem('badges') || '{}');

        // Contar módulos completos
        const modulosCompletos = {
            m1: badges.m1 && badges.m1.length > 0,
            m2: badges.m2 && badges.m2.length > 0,
            m3: badges.m3 && badges.m3.length > 0
        };
        const numModulosCompletos = (modulosCompletos.m1 ? 1 : 0) + (modulosCompletos.m2 ? 1 : 0) + (modulosCompletos.m3 ? 1 : 0);

        // Acompanhamento: liberado se pelo menos 1 módulo completo
        const acompanhamento = ['extras-resumo', 'extras-flashcards', 'extras-questionarios'];
        if (acompanhamento.includes(pageId)) {
            return numModulosCompletos >= 1;
        }

        // Especiais: liberado por módulo específico
        const especiais = {
            'extras-arraste': 'm1',
            'extras-ache-erro': 'm2',
            'extras-roleplay': 'm3'
        };
        if (especiais[pageId]) {
            return modulosCompletos[especiais[pageId]];
        }

        return true; // Se não tiver requisito, está desbloqueado
    },

    /**
     * Obtém contagem de módulos completos
     * @returns {number}
     */
    getCompletedModulesCount: function () {
        const badges = JSON.parse(localStorage.getItem('badges') || '{}');
        let count = 0;
        if (badges.m1 && badges.m1.length > 0) count++;
        if (badges.m2 && badges.m2.length > 0) count++;
        if (badges.m3 && badges.m3.length > 0) count++;
        return count;
    },

    /**
     * Adiciona uma badge para um módulo
     * @param {string} moduleId - ID do módulo (m1, m2, m3)
     * @param {string} badgeType - Tipo da badge
     */
    addBadge: function (moduleId, badgeType) {
        const badges = JSON.parse(localStorage.getItem('badges') || '{}');
        if (!badges[moduleId]) {
            badges[moduleId] = [];
        }
        if (!badges[moduleId].includes(badgeType)) {
            badges[moduleId].push(badgeType);
            localStorage.setItem('badges', JSON.stringify(badges));
        }
    }
};
