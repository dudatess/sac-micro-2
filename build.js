const fs = require('fs');
const path = require('path');

const CONFIG = {
    src: '.',
    dist: 'dist',
    exclude: [
        'dist',
        '.git',
        '.gitignore',
        '.agent',
        'build.js',
        'package.json',
        'package-lock.json',
        'README.md',
        'node_modules',
        'task.md',
        'implementation_plan.md',
        'walkthrough.md'
    ],
    // Arquivos para minificar
    minify: {
        js: true,
        css: true,
        html: true,
        json: true
    }
};

// Função para deletar diretório recursivamente
function cleanDist(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`[Clean] Deleted ${dir}`);
    }
}

// Função de minificação simples (Basic Stripping)
function minifyCode(content, extension) {
    if (extension === '.js') {
        // Remove comentários de linha (//) e bloco (/* */)
        // Preserva strings e regex (muito básico, cuidado com edge cases complexos)
        // Para este projeto, vamos ser conservadores para não quebrar a lógica

        // Remove comentários de bloco /* ... */
        content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
            // Preservar cabeçalhos de copyright se começarem com /* * ©
            if (match.startsWith('/*\n * ©')) return match;
            return '';
        });

        // Remove comentários de linha // (perigoso se URL ou regex, mas ok para safe code)
        // content = content.replace(/\/\/.*/g, ''); 

        // Remove linhas vazias e espaços repetidos
        content = content.replace(/^\s*[\r\n]/gm, '').replace(/\s+/g, ' ');
        return content;
    } else if (extension === '.css') {
        // Remove comentários e espaços
        return content
            .replace(/\/\*[\s\S]*?\*\//g, (match) => {
                if (match.startsWith('/*\n * ©')) return match;
                return '';
            })
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}:;,])\s*/g, '$1');
    } else if (extension === '.json') {
        try {
            return JSON.stringify(JSON.parse(content));
        } catch (e) {
            console.warn('Invalid JSON for minification, keeping original');
            return content;
        }
    }
    return content;
}

// Função para copiar recursivamente
function copyRecursive(src, dest) {
    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        fs.readdirSync(src).forEach(childItemName => {
            // Ignorar exclusions
            if (CONFIG.exclude.includes(childItemName)) return;
            // Ignorar pastas ocultas (exceto se necessário)
            if (childItemName.startsWith('.') && childItemName !== '.htaccess') return;

            copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        const ext = path.extname(src).toLowerCase();
        let content = fs.readFileSync(src);

        // Minificar se habilitado e suportado
        if (CONFIG.minify[ext.substring(1)]) {
            try {
                // Converter Buffer para string para manipulação
                const strContent = content.toString('utf8');
                const minified = minifyCode(strContent, ext);
                fs.writeFileSync(dest, minified);
                // console.log(`[Minify] Processed ${dest}`);
                return;
            } catch (e) {
                console.warn(`[Warn] Failed to minify ${src}, copying raw.`);
            }
        }

        fs.copyFileSync(src, dest);
    }
}

// Execução
console.log('🚀 Starting Build Process...');

// 1. Clean
cleanDist(CONFIG.dist);

// 2. Create Dist
if (!fs.existsSync(CONFIG.dist)) {
    fs.mkdirSync(CONFIG.dist);
}

// 3. Copy & Process
console.log('📦 Copying and optimizing files...');
copyRecursive(CONFIG.src, CONFIG.dist);

console.log('✅ Build completed successfully! Output in /dist');
