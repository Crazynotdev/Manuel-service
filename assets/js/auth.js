/**
 * Système d'authentification sécurisé - Maintenance IT Pro
 * Gestion des sessions admin et protection des accès
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 60 * 60 * 1000; // 1 heure
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.setupEventListeners();
    }

    // Vérifie si une session existe déjà
    checkExistingSession() {
        const userData = localStorage.getItem('adminSession');
        const sessionTime = localStorage.getItem('sessionTime');
        
        if (userData && sessionTime) {
            const timeDiff = Date.now() - parseInt(sessionTime);
            if (timeDiff < this.sessionTimeout) {
                this.currentUser = JSON.parse(userData);
                this.redirectToAdmin();
            } else {
                this.clearSession();
            }
        }
    }

    // Configuration des écouteurs d'événements
    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Protection contre les injections
        document.addEventListener('input', (e) => {
            if (e.target.type === 'text' || e.target.type === 'password') {
                this.sanitizeInput(e.target);
            }
        });
    }

    // Gestion de la connexion
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');

        // Validation des entrées
        if (!this.validateCredentials(username, password)) {
            this.showError(errorDiv, 'Identifiants invalides');
            return;
        }

        // Simulation d'authentification sécurisée
        try {
            const isAuthenticated = await this.authenticateUser(username, password);
            
            if (isAuthenticated) {
                this.createSession(username);
                this.redirectToAdmin();
            } else {
                this.showError(errorDiv, 'Nom d\'utilisateur ou mot de passe incorrect');
            }
        } catch (error) {
            this.showError(errorDiv, 'Erreur de connexion. Veuillez réessayer.');
            console.error('Auth error:', error);
        }
    }

    // Validation des identifiants
    validateCredentials(username, password) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        const passwordRegex = /^.{6,50}$/;
        
        return usernameRegex.test(username) && passwordRegex.test(password);
    }

    // Authentification sécurisée
    async authenticateUser(username, password) {
        // Simulation d'une requête API sécurisée
        return new Promise((resolve) => {
            setTimeout(() => {
                // En production, remplacer par une vraie vérification backend
                const validUsers = {
                    'admin': 'Manuel2025',
                    'technicien': 'TechCrazy!',
                    'support': 'davidtech!'
                };
                
                resolve(validUsers[username] === password);
            }, 1000);
        });
    }

    // Création de session sécurisée
    createSession(username) {
        const userData = {
            username: username,
            loginTime: Date.now(),
            sessionId: this.generateSessionId(),
            role: this.getUserRole(username)
        };

        this.currentUser = userData;
        
        // Stockage sécurisé
        localStorage.setItem('adminSession', JSON.stringify(userData));
        localStorage.setItem('sessionTime', Date.now().toString());
        
        // Cookie de session (optionnel)
        this.setSessionCookie(userData.sessionId);
    }

    // Génération d'ID de session unique
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Rôle utilisateur
    getUserRole(username) {
        const roles = {
            'admin': 'administrateur',
            'technicien': 'technicien',
            'support': 'support'
        };
        return roles[username] || 'utilisateur';
    }

    // Cookie de session
    setSessionCookie(sessionId) {
        const expires = new Date(Date.now() + this.sessionTimeout).toUTCString();
        document.cookie = `adminSession=${sessionId}; expires=${expires}; path=/; Secure; SameSite=Strict`;
    }

    // Déconnexion
    handleLogout() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            this.clearSession();
            window.location.href = 'login.html';
        }
    }

    // Nettoyage de session
    clearSession() {
        this.currentUser = null;
        localStorage.removeItem('adminSession');
        localStorage.removeItem('sessionTime');
        
        // Suppression du cookie
        document.cookie = 'adminSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    // Redirection vers l'admin
    redirectToAdmin() {
        window.location.href = 'admin.html';
    }

    // Affichage des erreurs
    showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    // Nettoyage des entrées
    sanitizeInput(input) {
        input.value = input.value.replace(/[<>]/g, '');
    }

    // Vérification des permissions
    hasPermission(requiredRole) {
        if (!this.currentUser) return false;
        
        const roleHierarchy = {
            'support': 1,
            'technicien': 2,
            'administrateur': 3
        };
        
        const userLevel = roleHierarchy[this.currentUser.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }

    // Middleware de protection de route
    protectRoute(requiredRole = 'support') {
        if (!this.currentUser || !this.hasPermission(requiredRole)) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
}

// Initialisation globale
const authSystem = new AuthSystem();

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}
