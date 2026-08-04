/* NexaMind — Complete UI with Toggle System */

 

// Load theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update toggle icons
    document.querySelectorAll('.theme-toggle, .theme-toggle-small').forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    });
});

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Close sidebar on outside click (mobile)
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !toggleBtn?.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// ===== PASSWORD TOGGLE =====
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const wrapper = input.closest('.input-wrapper');
    const toggleBtn = wrapper?.querySelector('.toggle-password');
    const icon = toggleBtn?.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        if (icon) icon.className = 'fas fa-eye';
    }
}

// ===== PROFILE DROPDOWN TOGGLE =====
function toggleDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('open');
    }
}

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu) {
        menu.classList.toggle('open');
    }
}

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
    // Close profile dropdown
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown && dropdown.classList.contains('open')) {
        if (!e.target.closest('.profile-dropdown')) {
            dropdown.classList.remove('open');
        }
    }
    
    // Close profile menu
    const menu = document.getElementById('profileMenu');
    if (menu && menu.classList.contains('open')) {
        if (!e.target.closest('.sidebar-profile')) {
            menu.classList.remove('open');
        }
    }
});

// ===== MARKDOWN PARSER =====
function parseMarkdown(text) {
    if (!text) return '';

    // Code blocks
    text = text.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, function(match, code) {
        const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return `<pre><code>${escapedCode.trim()}</code></pre>`;
    });

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

    // Italic
    text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

    // Lists
    text = text.replace(/^\s*[\-\*]\s+(.*)$/gm, '<ul><li>$1</li></ul>');
    text = text.replace(/<\/ul>\n<ul>/g, '');
    text = text.replace(/^\s*\d+\.\s+(.*)$/gm, '<ol><li>$1</li></ol>');
    text = text.replace(/<\/ol>\n<ol>/g, '');

    // Headers
    text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Blockquotes
    text = text.replace(/^>\s+(.*$)/gm, '<blockquote>$1</blockquote>');

    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Paragraphs
    const blocks = text.split(/\n\n+/);
    return blocks.map(block => {
        if (/^<(pre|ul|ol|h[1-6]|blockquote)/.test(block.trim())) {
            return block;
        }
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');
}

// ===== RENDER AI RESPONSE =====
function renderAiResponse(element, rawText) {
    if (!element) return;
    element.innerHTML = parseMarkdown(rawText);
    
    element.querySelectorAll('pre code').forEach(el => {
        if (typeof hljs !== 'undefined' && hljs.highlightElement) {
            hljs.highlightElement(el);
        }
    });
}

// ===== DELETE MODAL =====
let pendingDeleteId = null;

function openDeleteModal(chatId) {
    pendingDeleteId = chatId;
    const overlay = document.getElementById('delete-modal-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDeleteModal() {
    pendingDeleteId = null;
    const overlay = document.getElementById('delete-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function confirmDelete() {
    if (pendingDeleteId) {
        document.getElementById('delete-form-' + pendingDeleteId).submit();
    }
    closeDeleteModal();
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('delete-modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeDeleteModal();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeDeleteModal();
    });
});

// ===== CHAT FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.chat-form');
    const input = form ? form.querySelector('input[name="message"]') : null;
    const chatBox = document.getElementById('chatBox');

    if (!form || !input || !chatBox) return;

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        // Remove empty state
        const emptyState = chatBox.querySelector('.empty-chat-state');
        if (emptyState) emptyState.remove();

        // Display user message
        const userMessage = createUserMessage(text);
        chatBox.appendChild(userMessage);
        input.value = '';
        scrollToBottom(chatBox);

        // Show AI thinking
        const aiPlaceholder = createAiPlaceholder();
        chatBox.appendChild(aiPlaceholder);
        scrollToBottom(chatBox);

        // Send to server
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
                aiPlaceholder.innerHTML = createAiError(data.error || 'Something went wrong.');
                return;
            }

            // Replace placeholder with actual response
            const aiMessage = createAiMessage(data.reply_html);
            aiPlaceholder.replaceWith(aiMessage);
            renderAiResponse(aiMessage.querySelector('.ai-bubble'), data.reply_html);

        } catch (err) {
            aiPlaceholder.innerHTML = createAiError('Network error. Please check your connection.');
        }

        scrollToBottom(chatBox);
    });

    // Helper functions
    function createUserMessage(text) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper user-message';
        wrapper.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-circle" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
                    ${document.querySelector('.profile-avatar')?.textContent || 'U'}
                </div>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender-name">You</span>
                    <span class="message-time">${formatTime()}</span>
                </div>
                <div class="message-bubble user-bubble">
                    ${escapeHtml(text)}
                </div>
            </div>
        `;
        return wrapper;
    }

    function createAiPlaceholder() {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper ai-message';
        wrapper.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-circle" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                    <i class="fas fa-robot"></i>
                </div>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender-name">NexaMind AI</span>
                </div>
                <div class="message-bubble ai-bubble">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        return wrapper;
    }

    function createAiMessage(html) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper ai-message';
        wrapper.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-circle" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                    <i class="fas fa-robot"></i>
                </div>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender-name">NexaMind AI</span>
                    <span class="message-time">${formatTime()}</span>
                </div>
                <div class="message-bubble ai-bubble">
                    ${html}
                </div>
            </div>
        `;
        return wrapper;
    }

    function createAiError(message) {
        return `
            <div class="message-wrapper ai-message">
                <div class="message-avatar">
                    <div class="avatar-circle" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <i class="fas fa-robot"></i>
                    </div>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="sender-name">NexaMind AI</span>
                    </div>
                    <div class="message-bubble ai-bubble error">
                        <i class="fas fa-exclamation-circle"></i>
                        ${message}
                    </div>
                </div>
            </div>
        `;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    function scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }

    // Scroll to bottom on load
    scrollToBottom(chatBox);
});

// ===== PASSWORD STRENGTH INDICATOR =====
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strength = getPasswordStrength(this.value);
            const level = document.getElementById('strengthLevel');
            const text = document.getElementById('strengthText');
            
            if (level) {
                level.style.width = strength.percentage + '%';
                level.style.background = strength.color;
            }
            if (text) {
                text.textContent = strength.label;
                text.style.color = strength.color;
            }
        });
    }

    // Confirm password validation
    const confirmInput = document.getElementById('confirm_password');
    if (confirmInput) {
        confirmInput.addEventListener('input', function() {
            const password = document.getElementById('password');
            const hint = document.getElementById('confirmHint');
            const status = document.getElementById('confirmStatus');
            
            if (password && hint) {
                if (this.value === password.value && this.value.length > 0) {
                    hint.textContent = '✓ Passwords match';
                    hint.style.color = '#10b981';
                    if (status) status.textContent = '✓';
                } else if (this.value.length > 0) {
                    hint.textContent = '✗ Passwords do not match';
                    hint.style.color = '#ef4444';
                    if (status) status.textContent = '✗';
                } else {
                    hint.textContent = 'Passwords must match';
                    hint.style.color = '#6b7280';
                    if (status) status.textContent = '';
                }
            }
        });
    }
});

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengths = [
        { label: 'Very Weak', color: '#ef4444', percentage: 20 },
        { label: 'Weak', color: '#f59e0b', percentage: 40 },
        { label: 'Fair', color: '#fbbf24', percentage: 60 },
        { label: 'Strong', color: '#10b981', percentage: 80 },
        { label: 'Very Strong', color: '#059669', percentage: 100 }
    ];

    return strengths[Math.min(score, strengths.length - 1)];
}
