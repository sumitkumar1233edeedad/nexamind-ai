/* NexaMind — UI behaviors & AI response formatting */

// Simple Markdown parser for AI chat responses
function parseMarkdown(text) {
    if (!text) return '';

    // 1. Convert code blocks: ```lang\ncode\n```
    text = text.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, function(match, code) {
        // Escape HTML tags inside code blocks
        const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return `<pre><code>${escapedCode.trim()}</code></pre>`;
    });

    // 2. Convert inline code: `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 3. Convert bold text: **bold** or __bold__
    text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

    // 4. Convert italic text: *italic* or _italic_
    text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

    // 5. Convert unordered lists: - item or * item
    text = text.replace(/^\s*[\-\*]\s+(.*)$/gm, '<ul><li>$1</li></ul>');
    // Fix consecutive list items merging
    text = text.replace(/<\/ul>\n<ul>/g, '');

    // 6. Convert ordered lists: 1. item
    text = text.replace(/^\s*\d+\.\s+(.*)$/gm, '<ol><li>$1</li></ol>');
    text = text.replace(/<\/ol>\n<ol>/g, '');

    // Automatically color all code blocks inside AI messages
    document.querySelectorAll('.reply-message pre code').forEach((el) => {
        hljs.highlightElement(el);
    });
    // 7. Paragraph & double newline handling (skip block elements like pre/ul/ol)
    const blocks = text.split(/\n\n+/);
    return blocks.map(block => {
        if (/^<(pre|ul|ol)/.test(block.trim())) {
            return block;
        }
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');
}

// Function to safely insert AI responses formatted into HTML
function renderAiResponse(element, rawText) {
    if (!element) return;
    element.innerHTML = parseMarkdown(rawText);
}

function togglePassword() {
    const icon = (arguments[1] && arguments[1].nodeType) ? arguments[1] : (window.event && window.event.target);
    if (!icon) return;

    const wrapper = icon.closest('.input-wrapper');
    const input = wrapper && wrapper.querySelector('input[type="password"], input.pw-visible');
    if (!input) return;

    const showing = input.type === 'password';
    input.type = showing ? 'text' : 'password';
    input.classList.toggle('pw-visible', showing);
    icon.textContent = showing ? '🙈' : '👁️';
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.chat-main form');       // the message form
    const input = form ? form.querySelector('input[name="message"]') : null;
    const chatBox = document.querySelector('.chat-box');

    if (!form || !input || !chatBox) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        // Remove the "Say hello to start this chat" placeholder if present
        const emptyState = chatBox.querySelector('p');
        if (emptyState && chatBox.children.length === 1) emptyState.remove();

        // 1. Show user's message immediately
        const userDiv = document.createElement('div');
        userDiv.className = 'ai-message';
        userDiv.innerHTML = `<p><strong>You:</strong> ${escapeHtml(text)}</p>`;
        chatBox.appendChild(userDiv);
        input.value = '';

        // 2. Show a "Thinking..." placeholder for the AI
        const replyDiv = document.createElement('div');
        replyDiv.className = 'reply-message';
        replyDiv.innerHTML = `<p><strong>AI</strong> <em>Thinking…</em></p>`;
        chatBox.appendChild(replyDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        // 3. Send to the same view, tagged as AJAX
        try {
            const res = await fetch(form.action || window.location.href, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': form.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: new URLSearchParams({ message: text }),
            });

            const data = await res.json();

            if (!res.ok) {
                replyDiv.innerHTML = `<p><strong>AI</strong> <em>${data.error || 'Something went wrong.'}</em></p>`;
                return;
            }

            // 4. Replace placeholder with the real AI reply
            replyDiv.innerHTML = `<p><strong>AI</strong> ${data.reply_html}</p>`;
            replyDiv.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));

        } catch (err) {
            replyDiv.innerHTML = `<p><strong>AI</strong> <em>Network error. Please try again.</em></p>`;
        }

        chatBox.scrollTop = chatBox.scrollHeight;
    });

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});

let pendingDeleteId = null;

function openDeleteModal(chatId) {
    pendingDeleteId = chatId;
    document.getElementById('delete-modal-overlay').classList.add('active');
}

function closeDeleteModal() {
    pendingDeleteId = null;
    document.getElementById('delete-modal-overlay').classList.remove('active');
}

function confirmDelete() {
    if (pendingDeleteId) {
        document.getElementById('delete-form-' + pendingDeleteId).submit();
    }
    closeDeleteModal();
}

// Optional: close on overlay click or Escape key
document.getElementById('delete-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeDeleteModal();
});



