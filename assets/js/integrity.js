/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * integrity.js - Verificação de Integridade e Interdependência
 * Garante que a estrutura do curso esteja completa e válida antes da execução.
 */

(function () {
    console.log("[Integrity] Starting system integrity check...");

    // Lista de módulos críticos que devem estar carregados
    const criticalModules = [
        'App',
        'I18n',
        'scorm'
    ];

    // Lista de arquivos críticos que devem existir (verificáveis via fetch)
    const criticalFiles = [
        'content.json',
        'imsmanifest.xml'
    ];

    function checkModules() {
        const missing = criticalModules.filter(mod => typeof window[mod] === 'undefined');
        if (missing.length > 0) {
            console.error("[Integrity] Critical modules missing:", missing);
            showIntegrityError(`System Integrity Error: Missing modules (${missing.join(', ')}). Reload validation required.`);
            return false;
        }
        return true;
    }

    async function checkFiles() {
        const errors = [];
        for (const file of criticalFiles) {
            try {
                const response = await fetch(file, { method: 'HEAD' });
                if (!response.ok) {
                    errors.push(file);
                }
            } catch (e) {
                errors.push(file);
            }
        }

        if (errors.length > 0) {
            console.error("[Integrity] Critical files missing or inaccessible:", errors);
            showIntegrityError(`System Integrity Error: Critical files missing (${errors.join(', ')}). The course structure is compromised.`);
            return false;
        }
        return true;
    }

    function showIntegrityError(message) {
        // Criar overlay de erro fatal
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            color: #ff3333;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify_content: center;
            text-align: center;
            font-family: monospace;
            padding: 2rem;
        `;
        overlay.innerHTML = `
            <h1 style="font-size: 2rem; margin-bottom: 1rem;">⛔ SECURITY ALERT</h1>
            <p style="font-size: 1.2rem; max-width: 600px;">${message}</p>
            <p style="margin-top: 2rem; color: #666; font-size: 0.9rem;">
                This course is protected by interdependence checks.<br>
            </p>
        `;
        document.body.appendChild(overlay);

        // Tentar parar a execução
        if (window.stop) window.stop();
        throw new Error(message);
    }

    // Executar verificações
    window.addEventListener('load', async () => {
        // Verificação imediata de módulos (já devem estar carregados no load)
        if (!checkModules()) return;

        // Verificação de arquivos (assíncrona)
        if (!await checkFiles()) return;

        console.log("[Integrity] System integrity verified. All checks passed.");
    });

})();
