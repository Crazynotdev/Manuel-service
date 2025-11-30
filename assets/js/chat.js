/**
 * Système de Chat Professionnel - Maintenance IT Pro
 * Interface WhatsApp-like - Communication réelle sans simulation
 */

class ChatSystem {
    constructor() {
        this.currentConversation = null;
        this.isConnected = false;
        this.pendingMessages = [];
        this.init();
    }

    init() {
        this.initializeDOM();
        this.setupEventListeners();
        this.loadWelcomeMessage();
        this.initializeConnection();
        this.setupMessagePolling();
    }

    // Initialisation des éléments DOM
    initializeDOM() {
        this.elements = {
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-btn'),
            newChatBtn: document.getElementById('new-chat'),
            typingIndicator: document.getElementById('typing-indicator'),
            chatStatus: document.querySelector('.chat-status'),
            statusText: document.querySelector('.chat-status-text')
        };

        this.validateElements();
    }

    validateElements() {
        const requiredElements = ['chatMessages', 'chatInput', 'sendBtn'];
        requiredElements.forEach(key => {
            if (!this.elements[key]) {
                console.error(`Élément critique manquant: ${key}`);
            }
        });
    }

    // Configuration des écouteurs d'événements
    setupEventListeners() {
        // Envoi de message
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Entrée dans le champ de texte
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Nouvelle conversation
        this.elements.newChatBtn?.addEventListener('click', () => {
            this.startNewConversation();
        });

        // Gestion du focus
        this.elements.chatInput.addEventListener('focus', () => {
            this.markMessagesAsRead();
        });

        // Gestion de la visibilité
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.markMessagesAsRead();
            }
        });
    }

    // Initialisation de la connexion
    initializeConnection() {
        this.updateConnectionStatus('online');
        this.isConnected = true;
        
        // Vérifier s'il y a des conversations en cours
        this.loadExistingConversations();
    }

    // Chargement des conversations existantes
    loadExistingConversations() {
        const activeConversations = dataManager.getActiveConversations();
        if (activeConversations.length > 0) {
            this.currentConversation = activeConversations[0].id;
            this.loadConversationMessages(this.currentConversation);
        }
    }

    // Démarrer une nouvelle conversation
    startNewConversation() {
        if (this.currentConversation) {
            if (!confirm('Voulez-vous vraiment démarrer une nouvelle conversation ? La conversation actuelle sera sauvegardée.')) {
                return;
            }
        }

        this.currentConversation = null;
        this.clearChatInterface();
        this.loadWelcomeMessage();
        this.elements.chatInput.value = '';
        this.elements.chatInput.focus();
        
        this.showNotification('Prêt pour une nouvelle demande', 'success');
    }

    // Envoi de message client
    async sendMessage() {
        const message = this.elements.chatInput.value.trim();
        
        if (!message) {
            this.showNotification('Veuillez saisir un message', 'warning');
            return;
        }

        if (!this.isConnected) {
            this.showNotification('Connexion perdue. Reconnexion...', 'error');
            return;
        }

        // Nettoyage du message
        const cleanMessage = this.sanitizeMessage(message);
        
        if (cleanMessage.length === 0) {
            this.showNotification('Message vide après validation', 'warning');
            return;
        }

        try {
            // Création ou récupération de conversation
            if (!this.currentConversation) {
                this.currentConversation = dataManager.createConversation('Client', cleanMessage);
            } else {
                dataManager.addMessage(this.currentConversation, cleanMessage, 'client');
            }

            // Affichage du message
            this.displayMessage(cleanMessage, 'user');
            this.elements.chatInput.value = '';
            
            // Notification pour l'admin
            this.notifyAdminNewMessage(cleanMessage);

            // Focus sur le champ de saisie
            this.elements.chatInput.focus();

        } catch (error) {
            console.error('Erreur envoi message:', error);
            this.showNotification('Erreur lors de l\'envoi du message', 'error');
        }
    }

    // Affichage d'un message dans le chat
    displayMessage(content, sender, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.setAttribute('role', 'article');
        
        const messageTime = timestamp || new Date();
        const timeString = this.formatTime(messageTime);

        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(content)}</p>
            </div>
            <div class="message-time" aria-label="Envoyé à ${timeString}">
                ${timeString}
            </div>
        `;

        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Animation d'apparition
        messageDiv.style.animation = 'messageAppear 0.3s ease';
    }

    // Chargement des messages d'une conversation
    loadConversationMessages(conversationId) {
        const conversation = dataManager.conversations.get(conversationId);
        if (!conversation) return;

        this.clearChatInterface();
        
        conversation.messages.forEach(msg => {
            this.displayMessage(
                msg.content, 
                msg.sender, 
                new Date(msg.timestamp)
            );
        });

        this.markMessagesAsRead();
    }

    // Marquer les messages comme lus
    markMessagesAsRead() {
        if (!this.currentConversation) return;

        const conversation = dataManager.conversations.get(this.currentConversation);
        if (conversation) {
            conversation.messages.forEach(msg => {
                if (msg.sender === 'client') {
                    msg.read = true;
                }
            });
            dataManager.saveConversationsToStorage();
        }
    }

    // Notification à l'admin
    notifyAdminNewMessage(message) {
        // En production, remplacer par WebSocket ou API call
        console.log('📨 Nouveau message pour admin:', message);
        
        // Mettre à jour le badge de notification
        this.updateAdminNotificationBadge();
    }

    // Mise à jour du badge de notification
    updateAdminNotificationBadge() {
        const unreadCount = dataManager.getUnreadMessagesCount();
        const badge = document.querySelector('.nav-cta .notification-badge') || this.createNotificationBadge();
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // Création du badge de notification
    createNotificationBadge() {
        const badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ef4444;
            color: white;
            border-radius: 10px;
            min-width: 20px;
            height: 20px;
            font-size: 0.75rem;
            display: none;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        `;
        
        const ctaButton = document.querySelector('.nav-cta');
        if (ctaButton) {
            ctaButton.style.position = 'relative';
            ctaButton.appendChild(badge);
        }
        
        return badge;
    }

    // Polling pour les nouveaux messages (simulation WebSocket)
    setupMessagePolling() {
        // En production, remplacer par WebSocket
        setInterval(() => {
            this.checkForNewMessages();
        }, 3000); // Vérification toutes les 3 secondes
    }

    // Vérification des nouveaux messages
    checkForNewMessages() {
        if (!this.currentConversation) return;

        const conversation = dataManager.conversations.get(this.currentConversation);
        if (!conversation) return;

        const lastMessage = conversation.messages[conversation.messages.length - 1];
        
        // Vérifier si le dernier message est de l'agent et non affiché
        if (lastMessage && lastMessage.sender === 'agent' && !lastMessage.displayed) {
            this.displayMessage(lastMessage.content, 'agent', new Date(lastMessage.timestamp));
            lastMessage.displayed = true;
            dataManager.saveConversationsToStorage();
            
            // Notification sonore (optionnelle)
            this.playNotificationSound();
        }
    }

    // Son de notification
    playNotificationSound() {
        // Créer un son de notification simple
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio context non supporté');
        }
    }

    // Message de bienvenue
    loadWelcomeMessage() {
        const welcomeMessage = `
            👋 <strong>Bonjour ! Bienvenue chez Maintenance IT Pro</strong><br><br>
            Je suis votre assistant de support. Décrivez votre problème technique en détail et notre équipe d'experts vous répondra rapidement.<br><br>
            💡 <em>Conseil : Plus votre description est précise, plus nous pourrons vous aider rapidement !</em>
        `;
        
        this.displayMessage(welcomeMessage, 'agent');
    }

    // Nettoyage du message
    sanitizeMessage(message) {
        return message
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .substring(0, 1000) // Limite de caractères
            .trim();
    }

    // Échappement HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Formatage de l'heure
    formatTime(date) {
        return date.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // Scroll automatique
    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    // Effacement de l'interface
    clearChatInterface() {
        if (this.elements.chatMessages) {
            this.elements.chatMessages.innerHTML = '';
        }
    }

    // Mise à jour du statut de connexion
    updateConnectionStatus(status) {
        const statusConfig = {
            online: { class: 'online', text: 'En ligne - Prêt à aider' },
            offline: { class: 'offline', text: 'Hors ligne - Reconnexion...' },
            error: { class: 'error', text: 'Erreur de connexion' }
        };

        const config = statusConfig[status] || statusConfig.offline;
        
        if (this.elements.chatStatus) {
            this.elements.chatStatus.className = `chat-status ${config.class}`;
        }
        
        if (this.elements.statusText) {
            this.elements.statusText.textContent = config.text;
        }

        this.isConnected = status === 'online';
    }

    // Affichage de notification
    showNotification(message, type = 'info') {
        // Créer une notification toast
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Gestion des erreurs
    handleError(error, context = 'Chat system') {
        console.error(`${context}:`, error);
        this.showNotification('Une erreur est survenue', 'error');
        
        // En production, envoyer l'erreur à votre service de logging
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: error.message,
                fatal: false
            });
        }
    }

    // Nettoyage
    destroy() {
        // Cleanup des event listeners si nécessaire
        this.pendingMessages = [];
    }
}

// Initialisation globale
let chatSystem;

document.addEventListener('DOMContentLoaded', function() {
    try {
        chatSystem = new ChatSystem();
        
        // Exposer globalement pour le débogage
        window.chatSystem = chatSystem;
        
    } catch (error) {
        console.error('Erreur initialisation chat system:', error);
    }
});

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatSystem;
}
