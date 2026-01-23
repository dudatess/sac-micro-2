/*
 * t.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * SCORM 1.2 API Wrapper
 * Simplifies communication with the LMS
 */

var scorm = {
    API: null,
    initialized: false,
    debug: true,

    init: function () {
        let attempts = 0;
        const maxAttempts = 20;
        const self = this;

        const tryInit = function () {
            self.log("Searching for SCORM API... (attempt " + (attempts + 1) + "/" + maxAttempts + ")");
            self.API = self.findAPI(window);

            if (self.API) {
                const result = self.API.LMSInitialize("");

                // Se retornar "true", inicialização bem-sucedida
                if (result === "true") {
                    self.initialized = true;
                    self.log("✅ SCORM Initialized successfully after " + (attempts + 1) + " attempts.");

                    // Set status to incomplete if not attempted
                    const status = self.getValue("cmi.core.lesson_status");
                    self.log("Current lesson status: " + status);
                    if (status === "not attempted") {
                        self.setValue("cmi.core.lesson_status", "incomplete");
                        self.log("Status changed to: incomplete");
                    }
                    return;
                }

                // Se retornar "false", pode ser que já esteja inicializado (reload de página)
                // Vamos verificar se conseguimos ler dados do LMS
                if (result === "false") {
                    self.log("⚠️ LMSInitialize returned false - checking if already initialized...");
                    try {
                        const status = self.API.LMSGetValue("cmi.core.lesson_status");
                        if (status && status !== "") {
                            // Conseguimos ler dados! A sessão já está ativa
                            self.initialized = true;
                            self.log("✅ SCORM session already active (language change reload). Status: " + status);
                            return;
                        }
                    } catch (e) {
                        self.log("❌ Cannot read from LMS: " + e.message);
                    }
                }

                self.log("❌ LMSInitialize failed. Returned: " + result);
            }

            attempts++;
            if (attempts < maxAttempts) {
                self.log("API not found yet. Retrying in 100ms...");
                setTimeout(tryInit, 100);
            } else {
                self.log("❌ SCORM API NOT FOUND after " + maxAttempts + " attempts - Running in standalone mode.");
            }
        };

        tryInit();
    },

    findAPI: function (win) {
        this.log("=== SCORM API DETECTION DEBUG ===");

        // 1. Informações de contexto
        this.log("1. Context Information:");
        this.log("   - Current URL: " + window.location.href);
        this.log("   - Referrer: " + document.referrer);
        this.log("   - Is in iframe: " + (window !== window.top));

        // 2. Inspecionar window atual
        this.log("2. Current window:");
        this.log("   - window.API: " + (typeof win.API));
        this.log("   - window.API_1484_11: " + (typeof win.API_1484_11));
        this.log("   - window.parent: " + (typeof win.parent));
        this.log("   - window.top: " + (typeof win.top));
        this.log("   - window.opener: " + (typeof win.opener));
        this.log("   - window === window.parent: " + (win === win.parent));
        this.log("   - window === window.top: " + (win === win.top));

        // 3. Listar propriedades que contêm 'API'
        this.log("3. Window properties containing 'API':");
        let foundProps = false;
        try {
            for (let prop in win) {
                if (prop.toUpperCase().includes('API') || prop.toUpperCase().includes('SCORM') || prop.toUpperCase().includes('LMS')) {
                    this.log("   - " + prop + ": " + typeof win[prop]);
                    foundProps = true;
                }
            }
            if (!foundProps) {
                this.log("   - (none found)");
            }
        } catch (e) {
            this.log("   - Error listing properties: " + e.message);
        }

        // 4. Verificar window.parent
        if (win.parent && win.parent !== win) {
            this.log("4. Parent window:");
            this.log("   - parent.API: " + (typeof win.parent.API));
            this.log("   - parent.API_1484_11: " + (typeof win.parent.API_1484_11));

            try {
                this.log("5. Parent properties containing 'API':");
                foundProps = false;
                for (let prop in win.parent) {
                    if (prop.toUpperCase().includes('API') || prop.toUpperCase().includes('SCORM') || prop.toUpperCase().includes('LMS')) {
                        this.log("   - " + prop + ": " + typeof win.parent[prop]);
                        foundProps = true;
                    }
                }
                if (!foundProps) {
                    this.log("   - (none found)");
                }
            } catch (e) {
                this.log("   - ⚠️ Cannot access parent properties: " + e.message);
            }
        } else {
            this.log("4. Parent window: (same as current window)");
        }

        // 5. Verificar window.top
        if (win.top && win.top !== win) {
            this.log("6. Top window:");
            this.log("   - top.API: " + (typeof win.top.API));
            this.log("   - top.API_1484_11: " + (typeof win.top.API_1484_11));
        }

        this.log("=== STARTING STANDARD API SEARCH ===");

        let currentWin = win;
        let tries = 0;
        const maxTries = 500;

        this.log("Starting API search from window...");
        this.log("Initial window object: " + (currentWin ? "exists" : "null"));

        // First, try the current window and all parents
        while (currentWin && tries < maxTries) {
            this.log("Try #" + tries + " - Checking window...");

            // Check if API exists
            if (currentWin.API) {
                this.log("  → window.API exists!");
                if (typeof currentWin.API.LMSInitialize === "function") {
                    this.log("✅ SCORM API FOUND after " + tries + " attempts");
                    return currentWin.API;
                } else {
                    this.log("  → window.API exists but LMSInitialize is not a function");
                }
            } else {
                this.log("  → window.API does NOT exist");
            }

            // Check parent
            if (currentWin.parent) {
                this.log("  → window.parent exists");
                if (currentWin.parent !== currentWin) {
                    this.log("  → Moving to parent window...");
                    currentWin = currentWin.parent;
                } else {
                    this.log("  → window.parent === window (reached top)");
                    break;
                }
            } else {
                this.log("  → window.parent does NOT exist");
                break;
            }

            tries++;
        }

        // If not found in parent chain,        // Busca EXAUSTIVA em window.opener (POPUP MODE - SCORM Cloud)
        if (win.opener) {
            this.log("Checking window.opener...");
            this.log("   - opener exists: true");

            try {
                // 1. Verificar opener direto
                this.log("   - opener.API: " + (typeof win.opener.API));
                if (win.opener.API && typeof win.opener.API.LMSInitialize === "function") {
                    this.log("✅ SCORM API FOUND in window.opener.API");
                    return win.opener.API;
                }

                // 2. Verificar opener.parent
                this.log("   - opener.parent.API: " + (typeof win.opener.parent.API));
                if (win.opener.parent && win.opener.parent.API && typeof win.opener.parent.API.LMSInitialize === "function") {
                    this.log("✅ SCORM API FOUND in window.opener.parent.API");
                    return win.opener.parent.API;
                }

                // 3. Verificar opener.top
                this.log("   - opener.top.API: " + (typeof win.opener.top.API));
                if (win.opener.top && win.opener.top.API && typeof win.opener.top.API.LMSInitialize === "function") {
                    this.log("✅ SCORM API FOUND in window.opener.top.API");
                    return win.opener.top.API;
                }

                // 4. Verificar frames do opener
                if (win.opener.frames && win.opener.frames.length > 0) {
                    this.log("   - opener has " + win.opener.frames.length + " frames");
                    for (let i = 0; i < Math.min(win.opener.frames.length, 10); i++) {
                        try {
                            if (win.opener.frames[i].API && typeof win.opener.frames[i].API.LMSInitialize === "function") {
                                this.log("✅ SCORM API FOUND in window.opener.frames[" + i + "].API");
                                return win.opener.frames[i].API;
                            }
                        } catch (e) {
                            this.log("   - Cannot access frame[" + i + "]: " + e.message);
                        }
                    }
                }

                // 5. Verificar API_1484_11 (SCORM 2004 - para debug)
                if (win.opener.API_1484_11) {
                    this.log("   - ⚠️ opener.API_1484_11: " + (typeof win.opener.API_1484_11));
                    this.log("   - ⚠️ Found SCORM 2004 API (not compatible with this SCORM 1.2 course)");
                }

                this.log("   - ❌ API not found in any opener location");

            } catch (e) {
                this.log("   - ⚠️ Cannot access opener properties: " + e.message);
            }
        } else {
            this.log("Checking window.opener... (not available)");
        }

        // Busca em window.top
        if (win.top && win.top !== win) {
            this.log("Checking window.top...");
            try {
                if (win.top.API && typeof win.top.API.LMSInitialize === "function") {
                    this.log("✅ SCORM API FOUND in window.top");
                    return win.top.API;
                }
            } catch (e) {
                this.log("   - ⚠️ Cannot access top properties: " + e.message);
            }
        }

        this.log("❌ SCORM API NOT FOUND after checking " + tries + " window levels");
        this.log("=== END DEBUG ===");
        return null;
    },

    finish: function () {
        if (this.initialized) {
            // Garantir que o commit final seja feito antes de finalizar
            this.API.LMSCommit("");
            this.log("SCORM session finishing. Final commit executed.");
            this.API.LMSFinish("");
            this.initialized = false;
        }
    },

    getValue: function (element) {
        if (this.initialized) {
            return this.API.LMSGetValue(element);
        } else {
            // Mock data for local testing
            if (element === "cmi.core.lesson_location") return localStorage.getItem("scorm_location") || "";
            if (element === "cmi.core.lesson_status") return localStorage.getItem("scorm_status") || "not attempted";
            return "";
        }
    },

    setValue: function (element, value) {
        if (this.initialized) {
            var result = this.API.LMSSetValue(element, value);
            // Não fazer commit aqui - será feito no finish()
            return result;
        } else {
            this.log("Mock Set: " + element + " = " + value);
            if (element === "cmi.core.lesson_location") localStorage.setItem("scorm_location", value);
            if (element === "cmi.core.lesson_status") localStorage.setItem("scorm_status", value);
            if (element === "cmi.core.score.raw") localStorage.setItem("scorm_score", value);
            return "true";
        }
    },

    log: function (msg) {
        if (this.debug) {
            console.log("[SCORM]: " + msg);
        }
    }
};
