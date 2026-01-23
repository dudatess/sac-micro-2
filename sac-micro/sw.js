/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * Service Worker para Canais de Comunicação SAC
 * Permite funcionamento offline após primeiro carregamento
 */

const CACHE_NAME = 'sac-canais-v1';

// Arquivos essenciais para cache
const STATIC_ASSETS = [
    './',
    './index.html',
    './content.json',
    './manifest.json',

    // CSS
    './assets/css/style.css',

    // JavaScript
    './assets/js/app.js',
    './assets/js/accessibility.js',
    './assets/js/analytics.js',
    './assets/js/audio-manager.js',
    './assets/js/feedback.js',
    './assets/js/gamification.js',
    './assets/js/i18n.js',
    './assets/js/interactive.js',
    './assets/js/keyboard.js',
    './assets/js/navigation.js',
    './assets/js/scorm-api.js',
    './assets/js/simple-markdown.js',
    './assets/js/tutorial.js',

    // Páginas PT
    './paginas/pt/sac-intro.html',
    './paginas/pt/sac-hub.html',
    './paginas/pt/sac-redes.html',
    './paginas/pt/sac-lojas.html',
    './paginas/pt/sac-pessoal.html',
    './paginas/pt/sac-site.html',
    './paginas/pt/sac-app.html',
    './paginas/pt/sac-email.html',
    './paginas/pt/sac-conclusao.html',
    './paginas/pt/sac-fluxo.html',

    // Locales PT
    './locales/pt/global.json',
    './locales/pt/intro.json',
    './locales/pt/menu.json',
    './locales/pt/settings.json',
    './locales/pt/tts.json',
    './locales/pt/tutorial.json',
    './locales/pt/ui.json',
    './locales/pt/m1/abertura.json',
    './locales/pt/m1/app.json',
    './locales/pt/m1/conclusao.json',
    './locales/pt/m1/email.json',
    './locales/pt/m1/hub.json',
    './locales/pt/m1/intro.json',
    './locales/pt/m1/lojas.json',
    './locales/pt/m1/pessoal.json',
    './locales/pt/m1/redes.json',
    './locales/pt/m1/site.json',
    './locales/pt/extras/fluxo.json',
    './locales/pt/extras/hub.json',

    // Locales EN
    './locales/en/global.json',
    './locales/en/intro.json',
    './locales/en/menu.json',
    './locales/en/settings.json',
    './locales/en/tts.json',
    './locales/en/tutorial.json',
    './locales/en/ui.json',
    './locales/en/m1/abertura.json',
    './locales/en/m1/app.json',
    './locales/en/m1/conclusao.json',
    './locales/en/m1/email.json',
    './locales/en/m1/hub.json',
    './locales/en/m1/intro.json',
    './locales/en/m1/lojas.json',
    './locales/en/m1/pessoal.json',
    './locales/en/m1/redes.json',
    './locales/en/m1/site.json',
    './locales/en/extras/fluxo.json',
    './locales/en/extras/hub.json',

    // Locales ES
    './locales/es/global.json',
    './locales/es/intro.json',
    './locales/es/menu.json',
    './locales/es/settings.json',
    './locales/es/tts.json',
    './locales/es/tutorial.json',
    './locales/es/ui.json',
    './locales/es/m1/abertura.json',
    './locales/es/m1/app.json',
    './locales/es/m1/conclusao.json',
    './locales/es/m1/email.json',
    './locales/es/m1/hub.json',
    './locales/es/m1/intro.json',
    './locales/es/m1/lojas.json',
    './locales/es/m1/pessoal.json',
    './locales/es/m1/redes.json',
    './locales/es/m1/site.json',
    './locales/es/extras/fluxo.json',
    './locales/es/extras/hub.json',

    // Locales FR
    './locales/fr/global.json',
    './locales/fr/intro.json',
    './locales/fr/menu.json',
    './locales/fr/settings.json',
    './locales/fr/tts.json',
    './locales/fr/tutorial.json',
    './locales/fr/ui.json',
    './locales/fr/m1/abertura.json',
    './locales/fr/m1/app.json',
    './locales/fr/m1/conclusao.json',
    './locales/fr/m1/email.json',
    './locales/fr/m1/hub.json',
    './locales/fr/m1/intro.json',
    './locales/fr/m1/lojas.json',
    './locales/fr/m1/pessoal.json',
    './locales/fr/m1/redes.json',
    './locales/fr/m1/site.json',
    './locales/fr/extras/fluxo.json',
    './locales/fr/extras/hub.json',

    // Imagens e marca
    './assets/marca/Logo-Grupo-Zaffari_Preto.png',
    './assets/marca/mascote.png'
];

// Instalar Service Worker e cachear arquivos
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando arquivos estáticos...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Arquivos cacheados com sucesso!');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Erro ao cachear:', error);
            })
    );
});

// Ativar e limpar caches antigos
self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando Service Worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

// Interceptar requisições - estratégia Cache First
self.addEventListener('fetch', (event) => {
    // Ignorar requisições não-GET
    if (event.request.method !== 'GET') return;

    // Ignorar requisições externas (ex: VLibras, fonts)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Retornar do cache
                    return cachedResponse;
                }

                // Buscar da rede e cachear
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Verificar se resposta válida
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        // Clonar e cachear
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // Offline e não está no cache
                        console.log('[SW] Offline - recurso não disponível:', event.request.url);
                    });
            })
    );
});

// Mensagem para atualizar cache
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
