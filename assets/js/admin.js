/**
 * Interface Administrateur - Maintenance IT Pro
 * Gestion complète des conversations et experts
 */

class AdminPanel {
    constructor() {
        this.currentConversation = null;
        this.selectedExpert = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        // Vérification de l'authentification
        if (!authSystem.protectRoute('support')) {
            return;
        }

        await this.initializePanel();
        this.setupEventListeners();
        this.startRealTimeUpdates();
        this.isInitialized = true;
    }

    // Initialisation du panel admin
    async initializePanel() {
        this.initializeDOM();
        this.loadExpertsList();
        this.loadConversationsList();
        this.updateDashboardStats();
        this.setupServicePricing();
        
        // Afficher les informations utilisateur
        this.displayUserInfo();
    }

    // Initialisation des éléments DOM
    initializeDOM() {
        this.elements = {
            // Conversations
            conversationList: document.getElementById('conversation-list'),
            adminChatMessages: document.getElementById('admin-chat-messages'),
            adminInput: document.getElementById('admin-input'),
            adminSend: document.getElementById('admin-send'),
            adminInputArea: document.getElementById('admin-input-area'),
            
            // Experts
            expertsList: document.getElementById('experts-list'),
            assignExpertBtn: document.getElementById('assign-expert'),
            
            // Informations client
            clientName: document.getElementById('client-name'),
            clientStatus: document.getElementById('client-status'),
            
            // Calculateur de prix
            serviceType: document.getElementById('service-type'),
            complexity: document.getElementById('complexity'),
            hours: document.getElementById('hours'),
            calculatePrice: document.getElementById('calculate-price'),
            priceResult: document.getElementById('price-result'),
            
            // Actions
            closeChatBtn: document.getElementById('close-chat'),
            
            // Statistiques
            onlineCount: document.getElementById('online-count'),
            adminName: document.getElementById('admin-name')
        };

        this.validateAdminElements();
    }

    validateAdminElements() {
        const required = ['conversationList', 'adminChatMessages', 'adminInput', 'adminSend'];
        required.forEach(key => {
            if (!this.elements[key]) {
                throw new Error(`Élément admin manquant: ${key}`);
            }
        });
    }

    // Configuration des écouteurs d'événements
    setupEventListeners() {
        // Envoi de message admin
        this.elements.adminSend.addEventListener('click', () => this.sendAdminMessage());
        this.elements.adminInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendAdminMessage();
            }
        });

        // Assignation d'expert
        this.elements.assignExpertBtn?.addEventListener('click', () => {
            this.showExpertAssignmentModal();
        });

        // Calculateur de prix
        this.elements.calculatePrice?.addEventListener('click', () => {
            this.calculateServicePrice();
        });

        // Fermeture de conversation
        this.elements.closeChatBtn?.addEventListener('click', () => {
            this.closeCurrentConversation();
        });

        // Recherche en temps réel
        this.elements.adminInput?.addEventListener('input', (e) => {
            this.handleAdminTyping(e.target.value);
        });

        // Rafraîchissement manuel
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.refreshData();
            }
        });
    }

    // Chargement de la liste des conversations
    loadConversationsList() {
        const conversations = dataManager.getActiveConversations();
        this.elements.conversationList.innerHTML = '';

        if (conversations.length === 0) {
            this.elements.conversationList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>Aucune conversation active</p>
                </div>
            `;
            return;
        }

        conversations.forEach(conversation => {
            const conversationItem = this.createConversationItem(conversation);
            this.elements.conversationList.appendChild(conversationItem);
        });

        // Sélectionner la première conversation par défaut
        if (conversations.length > 0 && !this.currentConversation) {
            this.selectConversation(conversations[0].id);
        }
    }

    // Création d'un élément de conversation
    createConversationItem(conversation) {
        const item = document.createElement('div');
        item.className = `conversation-item ${conversation.id === this.currentConversation ? 'active' : ''}`;
        item.dataset.conversationId = conversation.id;

        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const unreadCount = conversation.messages.filter(msg => 
            !msg.read && msg.sender === 'client'
        ).length;

        const timeAgo = this.getTimeAgo(conversation.lastActivity);

        item.innerHTML = `
            <div class="conversation-header">
                <strong>${conversation.clientName}</strong>
                ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
            </div>
            <div class="conversation-preview">
                ${lastMessage?.content.substring(0, 50)}...
            </div>
            <div class="conversation-meta">
                <span class="conversation-time">${timeAgo}</span>
                ${conversation.assignedExpert ? '<i class="fas fa-user-check assigned-icon"></i>' : ''}
            </div>
        `;

        item.addEventListener('click', () => {
            this.selectConversation(conversation.id);
        });

        return item;
    }

    // Sélection d'une conversation
    selectConversation(conversationId) {
        this.currentConversation = conversationId;
        
        // Mettre à jour l'interface
        this.updateConversationSelection();
        this.loadConversationMessages(conversationId);
        this.updateClientInfo(conversationId);
        this.showAdminInput();
        
        // Marquer les messages comme lus
        this.markConversationAsRead(conversationId);
    }

    // Chargement des messages d'une conversation
    loadConversationMessages(conversationId) {
        const conversation = dataManager.conversations.get(conversationId);
        if (!conversation) return;

        this.elements.adminChatMessages.innerHTML = '';

        conversation.messages.forEach(message => {
            this.displayAdminMessage(message.content, message.sender, new Date(message.timestamp));
        });

        this.scrollChatToBottom();
    }

    // Affichage d'un message dans l'admin
    displayAdminMessage(content, sender, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const timeString = timestamp.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(content)}</p>
            </div>
            <div class="message-time">${timeString}</div>
        `;

        this.elements.adminChatMessages.appendChild(messageDiv);
    }

    // Envoi de message par l'admin
    async sendAdminMessage() {
        const message = this.elements.adminInput.value.trim();
        
        if (!message || !this.currentConversation) {
            this.showAdminNotification('Veuillez sélectionner une conversation et saisir un message', 'warning');
            return;
        }

        try {
            // Ajouter le message
            dataManager.addMessage(this.currentConversation, message, 'agent');
            
            // Afficher le message
            this.displayAdminMessage(message, 'agent', new Date());
            this.elements.adminInput.value = '';
            
            // Scroll vers le bas
            this.scrollChatToBottom();

            // Sauvegarder
            dataManager.saveConversationsToStorage();

            this.showAdminNotification('Message envoyé', 'success');

        } catch (error) {
            console.error('Erreur envoi message admin:', error);
            this.showAdminNotification('Erreur lors de l\'envoi', 'error');
        }
    }

    // Assignation d'un expert
    async assignExpertToConversation(expertId) {
        if (!this.currentConversation) {
            this.showAdminNotification('Veuillez sélectionner une conversation', 'warning');
            return;
        }

        try {
            const success = dataManager.assignExpert(this.currentConversation, expertId);
            
            if (success) {
                this.showAdminNotification('Expert assigné avec succès', 'success');
                this.updateConversationSelection();
                this.updateClientInfo(this.currentConversation);
            } else {
                this.showAdminNotification('Erreur lors de l\'assignation', 'error');
            }
        } catch (error) {
            console.error('Erreur assignation expert:', error);
            this.showAdminNotification('Erreur lors de l\'assignation', 'error');
        }
    }

    // Calculateur de prix de service
    calculateServicePrice() {
        const serviceType = this.elements.serviceType.value;
        const complexity = this.elements.complexity.value;
        const hours = parseInt(this.elements.hours.value) || 1;

        if (!serviceType || !complexity) {
            this.showAdminNotification('Veuillez remplir tous les champs', 'warning');
            return;
        }

        const price = dataManager.calculatePrice(serviceType, complexity, hours);
        
        this.elements.priceResult.innerHTML = `
            <div class="price-estimate">
                <div class="price-amount">${price}€</div>
                <div class="price-details">
                    Pour ${hours} heure(s) de service ${serviceType}<br>
                    Niveau de complexité: ${complexity}
                </div>
                <button class="btn btn-sm" onclick="adminPanel.sendPriceEstimate(${price})">
                    Envoyer le devis au client
                </button>
            </div>
        `;
    }

    // Envoi du devis au client
    sendPriceEstimate(price) {
        if (!this.currentConversation) {
            this.showAdminNotification('Veuillez sélectionner une conversation', 'warning');
            return;
        }

        const message = `💰 **Devis estimatif**: ${price}€\n\nCette estimation inclut l'analyse complète et la résolution de votre problème. Confirmez-vous cette intervention ?`;
        
        dataManager.addMessage(this.currentConversation, message, 'agent');
        this.displayAdminMessage(message, 'agent', new Date());
        this.scrollChatToBottom();

        this.showAdminNotification('Devis envoyé au client', 'success');
    }

    // Fermeture de conversation
    closeCurrentConversation() {
        if (!this.currentConversation) {
            this.showAdminNotification('Aucune conversation sélectionnée', 'warning');
            return;
        }

        if (confirm('Êtes-vous sûr de vouloir clôturer cette conversation ?')) {
            const conversation = dataManager.conversations.get(this.currentConversation);
            if (conversation) {
                conversation.status = 'closed';
                dataManager.saveConversationsToStorage();
                
                this.showAdminNotification('Conversation clôturée', 'success');
                this.loadConversationsList();
                this.hideAdminInput();
            }
        }
    }

    // Mises à jour en temps réel
    startRealTimeUpdates() {
        // Vérifier les nouvelles conversations
        setInterval(() => {
            this.checkForNewConversations();
            this.checkForNewMessages();
            this.updateDashboardStats();
        }, 2000);

        // Vérifier la connexion
        setInterval(() => {
            this.updateConnectionStatus();
        }, 10000);
    }

    // Vérification des nouvelles conversations
    checkForNewConversations() {
        const currentCount = this.elements.conversationList.children.length;
        const activeConversations = dataManager.getActiveConversations();
        
        if (currentCount !== activeConversations.length) {
            this.loadConversationsList();
        }
    }

    // Vérification des nouveaux messages
    checkForNewMessages() {
        if (!this.currentConversation) return;

        const conversation = dataManager.conversations.get(this.currentConversation);
        if (!conversation) return;

        const displayedMessages = this.elements.adminChatMessages.children.length;
        
        if (displayedMessages !== conversation.messages.length) {
            this.loadConversationMessages(this.currentConversation);
        }
    }

    // Utilitaires d'interface
    updateConversationSelection() {
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', item.dataset.conversationId === this.currentConversation);
        });
    }

    showAdminInput() {
        if (this.elements.adminInputArea) {
            this.elements.adminInputArea.style.display = 'flex';
        }
    }

    hideAdminInput() {
        if (this.elements.adminInputArea) {
            this.elements.adminInputArea.style.display = 'none';
        }
    }

    scrollChatToBottom() {
        this.elements.adminChatMessages.scrollTop = this.elements.adminChatMessages.scrollHeight;
    }

    updateClientInfo(conversationId) {
        const conversation = dataManager.conversations.get(conversationId);
        if (!conversation) return;

        if (this.elements.clientName) {
            this.elements.clientName.textContent = conversation.clientName;
        }

        if (this.elements.clientStatus) {
            const status = conversation.assignedExpert ? 'Expert assigné' : 'En attente d\'expert';
            this.elements.clientStatus.textContent = status;
        }
    }

    markConversationAsRead(conversationId) {
        const conversation = dataManager.conversations.get(conversationId);
        if (conversation) {
            conversation.messages.forEach(msg => {
                if (msg.sender === 'client') {
                    msg.read = true;
                }
            });
            dataManager.saveConversationsToStorage();
            this.loadConversationsList();
        }
    }

    // Gestion des experts
    loadExpertsList() {
        const experts = dataManager.experts;
        this.elements.expertsList.innerHTML = '';

        experts.forEach(expert => {
            const expertItem = this.createExpertItem(expert);
            this.elements.expertsList.appendChild(expertItem);
        });
    }

    createExpertItem(expert) {
        const item = document.createElement('div');
        item.className = `expert-item ${expert.availability ? 'available' : 'unavailable'}`;
        
        item.innerHTML = `
            <div class="expert-avatar">${expert.avatar}</div>
            <div class="expert-info">
                <div class="expert-name">${expert.name}</div>
                <div class="expert-specialty">${expert.specialty}</div>
                <div class="expert-rate">${expert.hourlyRate}€/h</div>
            </div>
            <div class="expert-status">
                <i class="fas fa-circle ${expert.availability ? 'available' : 'unavailable'}"></i>
            </div>
        `;

        if (expert.availability) {
            item.addEventListener('click', () => {
                this.assignExpertToConversation(expert.id);
            });
        }

        return item;
    }

    // Statistiques et dashboard
    updateDashboardStats() {
        const stats = dataManager.getStatistics();
        
        if (this.elements.onlineCount) {
            this.elements.onlineCount.textContent = `${stats.activeConversations} conversations actives`;
        }
    }

    displayUserInfo() {
        if (this.elements.adminName && authSystem.currentUser) {
            this.elements.adminName.textContent = `Connecté en tant que ${authSystem.currentUser.username}`;
        }
    }

    // Notification admin
    showAdminNotification(message, type = 'info') {
        // Implémentation similaire à chat.js
        console.log(`[ADMIN ${type.toUpperCase()}] ${message}`);
    }

    // Utilitaires
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}j`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}min`;
        return 'À l\'instant';
    }

    // Rafraîchissement manuel
    refreshData() {
        this.loadConversationsList();
        this.loadExpertsList();
        this.updateDashboardStats();
        this.showAdminNotification('Données rafraîchies', 'success');
    }
}

// Initialisation de l'admin panel
let adminPanel;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        adminPanel = new AdminPanel();
        window.adminPanel = adminPanel; // Pour le débogage
    } catch (error) {
        console.error('Erreur initialisation admin panel:', error);
        
        // Redirection vers la page de login en cas d'erreur
        if (error.message.includes('authentification')) {
            window.location.href = 'login.html';
        }
    }
});
