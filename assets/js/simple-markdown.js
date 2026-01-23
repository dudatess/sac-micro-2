/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * Simple Markdown Parser
 * A lightweight parser for basic Markdown syntax to avoid external dependencies.
 * Supports: Headers, Bold, Italic, Lists, Paragraphs
 */
const SimpleMarkdown = {
    parse: function (markdown) {
        if (!markdown) return '';

        let html = markdown;

        // Escape HTML to prevent injection (basic)
        // html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Headers (H1-H6)
        html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
        html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

        // Blockquotes
        html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

        // Lists (Unordered)
        // This is a simple implementation, might not handle nested lists perfectly
        // We replace lines starting with "- " with <li>, then wrap them in <ul>

        // Convert - item to <li>item</li>
        html = html.replace(/^- (.*$)/gim, '<li class="md-list-item">$1</li>');

        // Wrap <li> elements with <ul> (naive approach: if we see <li>, ensure it's in a list)
        // For simplicity in this lightweight version, we will just leave them as <li> 
        // and CSS can handle them or we wrap groups. 
        // Better regex for wrapping:
        html = html.replace(/(<li class="md-list-item">.*<\/li>\n?)+/gim, '<ul>$&</ul>');

        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

        // Paragraphs
        // Split by double newlines and wrap content that isn't already a tag in <p>
        // This is tricky with regex. A simpler way for this project:
        // just replace double newlines with <br><br> or <p> logic if not starting with <

        // Simple newline to br
        html = html.replace(/\n/gim, '<br>');

        // Cleanup multiple brs after block elements
        html = html.replace(/(<\/h[1-6]>|<ul.>|<\/ul>|<\/li>)<br>/gim, '$1');

        // Wrap raw text in div/p? For now, leave as is, as it's mixed content.

        return `<div class="markdown-body">${html}</div>`;
    }
};
