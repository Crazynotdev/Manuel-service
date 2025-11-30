/**
 * Gestionnaire de données - Maintenance IT Pro
 * Gestion centralisée des services, tarifs et conversations
 */

class DataManager {
    constructor() {
        this.services = [];
        this.pricing = [];
        this.conversations = new Map();
        this.experts = [];
        this.init();
    }

    init() {
        this.loadInitialData();
        this.setupDataPersistence();
    }

    // Chargement des données initiales
    loadInitialData() {
        this.services = this.getServicesData();
        this.pricing = this.getPricingData();
        this.experts = this.getExpertsData();
        this.loadConversationsFromStorage();
    }

    // === DONNÉES DES SERVICES ===
    getServicesData() {
        return [
            {
                id: 'support-urgent',
                icon: 'fas fa-headset',
                title: 'Support Urgent 24/7',
                description: 'Assistance immédiate pour vos urgences techniques avec garantie de réponse sous 15 minutes.',
                skills: ['Diagnostic rapide', 'Résolution à distance', 'Support téléphonique', 'Intervention express'],
                level: 'urgent',
                responseTime: '15 min',
                experts: ['Pierre T.', 'Marie L.']
            },
            {
                id: 'maintenance-reseau',
                icon: 'fas fa-network-wired',
                title: 'Maintenance Réseau',
                description: 'Gestion complète de votre infrastructure réseau avec monitoring proactif et sécurité avancée.',
                skills: ['Cisco Certified', 'Configuration VLAN', 'Sécurité firewall', 'Optimisation WiFi'],
                level: 'expert',
                responseTime: '30 min',
                experts: ['Jean D.', 'Sophie M.']
            },
            {
                id: 'securite-cyber',
                icon: 'fas fa-shield-alt',
                title: 'Sécurité Cybersécurité',
                description: 'Protection avancée contre les cybermenaces avec audits de sécurité et formation des équipes.',
                skills: ['Audit de sécurité', 'Protection DDoS', 'Formation phishing', 'Certification ISO27001'],
                level: 'expert',
                responseTime: '1 heure',
                experts: ['Alexandre R.', 'Nathalie B.']
            },
            {
                id: 'sauvegarde-cloud',
                icon: 'fas fa-cloud-upload-alt',
                title: 'Sauvegarde & Cloud',
                description: 'Solutions de sauvegarde sécurisées et migration cloud avec plan de reprise d\'activité.',
                skills: ['Sauvegarde automatisée', 'Migration AWS/Azure', 'PRA/PCI', 'Chiffrement AES-256'],
                level: 'avance',
                responseTime: '2 heures',
                experts: ['Thomas P.', 'Isabelle C.']
            },
            {
                id: 'dev-logiciel',
                icon: 'fas fa-code',
                title: 'Développement Logiciel',
                description: 'Développement d\'applications sur mesure et optimisation de vos solutions existantes.',
                skills: ['Full-Stack JS', 'API REST', 'Base de données', 'DevOps'],
                level: 'expert',
                responseTime: '4 heures',
                experts: ['David L.', 'Sarah K.']
            },
            {
                id: 'formation-equipe',
                icon: 'fas fa-chalkboard-teacher',
                title: 'Formation Équipe',
                description: 'Formations personnalisées pour renforcer les compétences techniques de vos équipes.',
                skills: ['Formation sur mesure', 'Support continu', 'Évaluation skills', 'Certifications'],
                level: 'standard',
                responseTime: '24 heures',
                experts: ['Michel B.', 'Céline D.']
            }
        ];
    }

    // === DONNÉES TARIFAIRES ===
    getPricingData() {
        return [
            {
                id: 'starter',
                name: 'Pack Starter',
                price: 99,
                period: 'par mois',
                features: [
                    'Support technique 9h-18h',
                    'Dépannage à distance',
                    'Réponse sous 2 heures',
                    '5 utilisateurs inclus',
                    'Sauvegarde basique'
                ],
                level: 'standard',
                popular: false,
                cta: 'Démarrer'
            },
            {
                id: 'pro',
                name: 'Pack Professionnel',
                price: 199,
                period: 'par mois',
                features: [
                    'Support 24/7 prioritaire',
                    'Intervention sur site incluse',
                    'Réponse sous 30 minutes',
                    '20 utilisateurs inclus',
                    'Sauvegarde avancée',
                    'Monitoring proactif',
                    'Formation équipe'
                ],
                level: 'avance',
                popular: true,
                cta: 'Choisir ce pack'
            },
            {
                id: 'enterprise',
                name: 'Pack Enterprise',
                price: 499,
                period: 'par mois',
                features: [
                    'Support dédié 24/7',
                    'Technicien attitré',
                    'Réponse sous 15 minutes',
                    'Utilisateurs illimités',
                    'Sauvegarde enterprise',
                    'Sécurité avancée',
                    'Audits réguliers',
                    'Formation illimitée'
                ],
                level: 'expert',
                popular: false,
                cta: 'Contactez-nous'
            }
        ];
    }

    // === DONNÉES EXPERTS ===
    getExpertsData() {
        return [
            {
                id: 'expert-1',
                name: 'Pierre Technicien',
                specialty: 'Support Urgent & Réseau',
                level: 'senior',
                certifications: ['CCNA', 'MCSA', 'ITIL'],
                availability: true,
                hourlyRate: 85,
                avatar: '👨‍💻'
            },
            {
                id: 'expert-2',
                name: 'Marie Security',
                specialty: 'Cybersécurité & Audit',
                level: 'expert',
                certifications: ['CISSP', 'CEH', 'ISO27001'],
                availability: true,
                hourlyRate: 120,
                avatar: '👩‍💼'
            },
            {
                id: 'expert-3',
                name: 'Jean DevOps',
                specialty: 'Cloud & Infrastructure',
                level: 'senior',
                certifications: ['AWS', 'Azure', 'Kubernetes'],
                availability: false,
                hourlyRate: 95,
                avatar: '👨‍🔧'
            }
        ];
    }

    // === GESTION DES CONVERSATIONS ===
    createConversation(clientName, initialMessage) {
        const conversationId = 'conv_' + Date.now();
        
        const conversation = {
            id: conversationId,
            clientName: clientName,
            clientId: this.generateClientId(),
            status: 'active',
            createdAt: new Date().toISOString(),
            lastActivity: Date.now(),
            messages: [
                {
                    id: this.generateMessageId(),
                    sender: 'client',
                    content: initialMessage,
                    timestamp: Date.now(),
                    read: false
                }
            ],
            assignedExpert: null,
            priority: 'medium',
            estimatedPrice: null
        };

        this.conversations.set(conversationId, conversation);
        this.saveConversationsToStorage();
        
        return conversationId;
    }

    addMessage(conversationId, message, sender = 'client') {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return null;

        const newMessage = {
            id: this.generateMessageId(),
            sender: sender,
            content: message,
            timestamp: Date.now(),
            read: sender === 'client' ? false : true
        };

        conversation.messages.push(newMessage);
        conversation.lastActivity = Date.now();
        
        this.saveConversationsToStorage();
        return newMessage;
    }

    assignExpert(conversationId, expertId) {
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
            conversation.assignedExpert = expertId;
            conversation.status = 'assigned';
            this.saveConversationsToStorage();
            return true;
        }
        return false;
    }

    // === CALCUL DE PRIX INTELLIGENT ===
    calculatePrice(serviceLevel, complexity, estimatedHours) {
        const baseRates = {
            'standard': 65,
            'avance': 85,
            'expert': 110,
            'urgent': 150
        };

        const complexityMultipliers = {
            'low': 1.0,
            'medium': 1.5,
            'high': 2.0,
            'critical': 3.0
        };

        const baseRate = baseRates[serviceLevel] || baseRates.standard;
        const multiplier = complexityMultipliers[complexity] || complexityMultipliers.medium;
        
        let total = baseRate * multiplier * estimatedHours;
        
        // Application de remises pour les gros projets
        if (estimatedHours > 10) {
            total *= 0.9; // 10% de remise
        }
        if (estimatedHours > 20) {
            total *= 0.85; // 15% de remise
        }

        return Math.round(total);
    }

    // === PERSISTANCE DES DONNÉES ===
    setupDataPersistence() {
        // Sauvegarde automatique avant fermeture
        window.addEventListener('beforeunload', () => {
            this.saveConversationsToStorage();
        });

        // Sauvegarde périodique
        setInterval(() => {
            this.saveConversationsToStorage();
        }, 30000); // Toutes les 30 secondes
    }

    saveConversationsToStorage() {
        const conversationsArray = Array.from(this.conversations.entries());
        localStorage.setItem('maintenance_conversations', JSON.stringify(conversationsArray));
    }

    loadConversationsFromStorage() {
        try {
            const stored = localStorage.getItem('maintenance_conversations');
            if (stored) {
                const conversationsArray = JSON.parse(stored);
                this.conversations = new Map(conversationsArray);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.conversations = new Map();
        }
    }

    // === UTILITAIRES ===
    generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    getActiveConversations() {
        return Array.from(this.conversations.values())
            .filter(conv => conv.status === 'active')
            .sort((a, b) => b.lastActivity - a.lastActivity);
    }

    getUnreadMessagesCount() {
        let count = 0;
        this.conversations.forEach(conv => {
            count += conv.messages.filter(msg => !msg.read && msg.sender === 'client').length;
        });
        return count;
    }

    // === STATISTIQUES ===
    getStatistics() {
        const totalConversations = this.conversations.size;
        const activeConversations = this.getActiveConversations().length;
        const unreadMessages = this.getUnreadMessagesCount();
        const avgResponseTime = this.calculateAverageResponseTime();

        return {
            totalConversations,
            activeConversations,
            unreadMessages,
            avgResponseTime
        };
    }

    calculateAverageResponseTime() {
        // Implémentation simplifiée
        return '15 min';
    }
}

// Instance globale
const dataManager = new DataManager();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
