// Variables globales pour les données JSON
let data = {};
let updateInterval;

// Fonctions utilitaires
async function fetchData() {
    try {
        const response = await fetch('./data/data.json?t=' + Date.now());
        if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erreur chargement JSON:', error);
        return {};
    }
}

async function saveData(updatedData) {
    console.log('Données sauvegardées :', updatedData);
    data = updatedData; // Mise à jour locale
    // Ici vous pourriez ajouter une vraie sauvegarde vers le serveur
    updateStatistics();
    loadEvents();
}

function showToast(message, type = 'success') {
    // Créer une alerte Bootstrap
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertElement = document.createElement('div');
    alertElement.className = `alert ${alertClass} alert-dismissible fade show position-fixed animate-fade-in`;
    alertElement.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertElement.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertElement);
    
    // Supprimer automatiquement après 3 secondes
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.remove();
        }
    }, 3000);
}

function showWelcomeAnimation(message) {
    showToast(message, 'success');
}

// Vérifie si un utilisateur est connecté
function checkLoggedInUser() {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = './index.html';
        return null;
    }
    return user;
}

// Mettre à jour les statistiques
function updateStatistics() {
    if (!data.events || !data.registrations) return;
    
    const totalEvents = data.events.length;
    const totalRegistrations = data.events.reduce((sum, event) => sum + event.registered, 0);
    const totalSpots = data.events.reduce((sum, event) => sum + event.maxParticipants, 0);
    const availableSpots = totalSpots - totalRegistrations;
    
    // Mise à jour avec animation
    animateNumber('totalEvents', totalEvents);
    animateNumber('totalRegistrations', totalRegistrations);
    animateNumber('availableSpots', availableSpots);
}

function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const duration = 1000; // 1 seconde
    const startTime = Date.now();
    
    function updateNumber() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(currentValue + (targetValue - currentValue) * progress);
        
        element.textContent = current;
        element.parentElement.classList.add('updating');
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.parentElement.classList.remove('updating');
        }
    }
    
    updateNumber();
}

// Afficher les événements sur la page d'accueil
function loadEvents() {
    const eventList = document.getElementById('eventList');
    if (eventList && data.events) {
        eventList.innerHTML = '';
        
        // Filtrer les événements à venir (après aujourd'hui)
        const today = new Date();
        const upcomingEvents = data.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today;
        });
        
        if (upcomingEvents.length === 0) {
            eventList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        <i class="fas fa-info-circle fa-2x mb-3"></i>
                        <h5>Aucun événement à venir</h5>
                        <p>Les prochaines portes ouvertes seront bientôt annoncées.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        upcomingEvents.forEach((event, index) => {
            const availability = event.maxParticipants - event.registered;
            const progressPercentage = (event.registered / event.maxParticipants) * 100;
            const isAlmostFull = progressPercentage > 80;
            const isFull = availability <= 0;
            
            const eventCard = document.createElement('div');
            eventCard.className = 'col-md-6 col-lg-4 mb-4';
            eventCard.innerHTML = `
                <div class="card glass-effect h-100 animate-fade-in" style="animation-delay: ${index * 0.1}s">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-calendar-day fa-2x text-primary me-3"></i>
                            <div>
                                <h5 class="card-title text-white mb-1">${event.title}</h5>
                                <small class="text-light">
                                    <i class="fas fa-clock me-1"></i>
                                    ${formatDate(event.date)}
                                </small>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-light">
                                    <i class="fas fa-users me-1"></i>Participants
                                </span>
                                <span class="badge ${isFull ? 'bg-danger' : isAlmostFull ? 'bg-warning' : 'bg-success'}">
                                    ${event.registered}/${event.maxParticipants}
                                </span>
                            </div>
                            <div class="progress mb-2">
                                <div class="progress-bar ${isFull ? 'bg-danger' : isAlmostFull ? 'bg-warning' : 'bg-success'}" 
                                     role="progressbar" 
                                     style="width: ${progressPercentage}%" 
                                     aria-valuenow="${event.registered}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="${event.maxParticipants}">
                                </div>
                            </div>
                            <small class="text-light">
                                <i class="fas fa-chair me-1"></i>
                                ${isFull ? 'Complet' : `${availability} places restantes`}
                            </small>
                        </div>
                        
                        <div class="mt-auto">
                            <button class="btn ${isFull ? 'btn-secondary' : 'btn-primary'} w-100" 
                                    ${isFull ? 'disabled' : ''} 
                                    onclick="handleEventRegistration(${event.id})">
                                <i class="fas ${isFull ? 'fa-times' : 'fa-plus'} me-2"></i>
                                ${isFull ? 'Complet' : 'S\'inscrire'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            eventList.appendChild(eventCard);
        });
    }
}

// Formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Gérer l'inscription à un événement
function handleEventRegistration(eventId) {
    // Rediriger vers la page de connexion si pas connecté
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) {
        showToast('Veuillez vous connecter pour vous inscrire', 'error');
        // Ouvrir le modal de connexion
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        return;
    }
    
    // Vérifier si l'utilisateur est déjà inscrit à cet événement
    const existingRegistration = data.registrations.find(reg => 
        reg.userId === user.userId && reg.eventId === eventId
    );
    
    if (existingRegistration) {
        showToast('Vous êtes déjà inscrit à cet événement', 'error');
        return;
    }
    
    // Trouver l'événement
    const event = data.events.find(e => e.id === eventId);
    if (!event) {
        showToast('Événement non trouvé', 'error');
        return;
    }
    
    // Vérifier s'il reste des places
    if (event.registered >= event.maxParticipants) {
        showToast('Désolé, cet événement est complet', 'error');
        return;
    }
    
    // Créer une nouvelle inscription
    const newRegistration = {
        registrationId: data.registrations.length + 1,
        userId: user.userId,
        eventId: eventId,
        name: user.username || user.email.split('@')[0],
        email: user.email,
        date: event.date,
        status: 'pending'
    };
    
    // Ajouter l'inscription
    data.registrations.push(newRegistration);
    
    // Mettre à jour le nombre d'inscrits
    event.registered++;
    
    // Sauvegarder les données
    saveData(data);
    
    showToast(`Inscription réussie pour "${event.title}" ! Votre demande est en attente de validation.`, 'success');
    
    // Rafraîchir l'affichage
    loadEvents();
    updateStatistics();
}

// Mise à jour automatique des données
function startRealTimeUpdates() {
    updateInterval = setInterval(async () => {
        const newData = await fetchData();
        if (JSON.stringify(newData) !== JSON.stringify(data)) {
            data = newData;
            updateStatistics();
            loadEvents();
            console.log('Données mises à jour automatiquement');
        }
    }, 30000); // Mise à jour toutes les 30 secondes
}

function stopRealTimeUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    data = await fetchData();
    updateStatistics();
    loadEvents();
    startRealTimeUpdates();
    
    // Initialiser le nouveau modal d'authentification
    initAuthModal();
});

// Gestionnaire pour le nouveau modal d'authentification
function initAuthModal() {
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const welcomeSignUpBtn = document.getElementById('welcomeSignUpBtn');
    const welcomeSignInBtn = document.getElementById('welcomeSignInBtn');
    
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const welcomeContent = document.getElementById('welcomeContent');
    const signUpWelcomeContent = document.getElementById('signUpWelcomeContent');
    
    // Toggle entre Sign In et Sign Up
    function showSignIn() {
        signInBtn.classList.add('active');
        signUpBtn.classList.remove('active');
        signInForm.classList.add('active');
        signUpForm.classList.remove('active');
        welcomeContent.classList.remove('d-none');
        signUpWelcomeContent.classList.add('d-none');
    }
    
    function showSignUp() {
        signUpBtn.classList.add('active');
        signInBtn.classList.remove('active');
        signUpForm.classList.add('active');
        signInForm.classList.remove('active');
        welcomeContent.classList.add('d-none');
        signUpWelcomeContent.classList.remove('d-none');
    }
    
    // Event listeners
    if (signInBtn) signInBtn.addEventListener('click', showSignIn);
    if (signUpBtn) signUpBtn.addEventListener('click', showSignUp);
    if (welcomeSignUpBtn) welcomeSignUpBtn.addEventListener('click', showSignUp);
    if (welcomeSignInBtn) welcomeSignInBtn.addEventListener('click', showSignIn);
    
    // Gestion du formulaire de connexion
    if (signInForm) {
        signInForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('signInEmail').value.trim();
            const password = document.getElementById('signInPassword').value;
            
            if (!email.endsWith('@laplateforme.io')) {
                showToast('Utilisez votre email @laplateforme.io', 'error');
                return;
            }
            
            const user = data.users.find(user => user.email === email && user.password === password && user.role === 'student');
            if (!user) {
                showToast('Email ou mot de passe incorrect.', 'error');
                return;
            }
            
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));
            showToast('Connexion réussie !');
            
            // Fermer le modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal.hide();
            
            setTimeout(() => {
                window.location.href = './student-dashboard.html';
            }, 1000);
        });
    }
    
    // Gestion du formulaire d'inscription
    if (signUpForm) {
        signUpForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('signUpUsername').value.trim();
            const email = document.getElementById('signUpEmail').value.trim();
            const password = document.getElementById('signUpPassword').value;
            
            if (!email.endsWith('@laplateforme.io')) {
                showToast('Seuls les emails @laplateforme.io sont autorisés.', 'error');
                return;
            }
            
            // Vérifier si l'utilisateur existe déjà
            const existingUser = data.users.find(user => user.email === email);
            if (existingUser) {
                showToast('Cet email est déjà utilisé.', 'error');
                return;
            }
            
            // Créer un nouvel utilisateur
            const newUser = {
                userId: data.users.length + 1,
                email: email,
                password: password,
                role: 'student',
                username: username
            };
            
            // Ajouter l'utilisateur aux données (simulation)
            data.users.push(newUser);
            await saveData(data);
            
            showToast('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            
            // Passer au formulaire de connexion
            showSignIn();
            document.getElementById('signInEmail').value = email;
        });
    }
    
    // Reset modal when closed
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('hidden.bs.modal', function() {
            showSignIn();
            signInForm.reset();
            signUpForm.reset();
        });
    }
}

// Nettoyage lors du déchargement de la page
window.addEventListener('beforeunload', function() {
    stopRealTimeUpdates();
});