// Variables globales pour les données JSON
let data = {};

// Fonctions utilitaires
async function fetchData() {
    try {
        const response = await fetch('../data/data.json');
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
}

function closeModal(modalId) {
    const modal = M.Modal.getInstance(document.getElementById(modalId));
    if (modal) modal.close();
}

function showToast(message, classes = 'blue darken-2') {
    M.toast({ html: message, classes });
}

function showWelcomeAnimation(message) {
    const div = $('<div class="welcome-animation"><p>' + message + '</p></div>');
    $('body').append(div);
    setTimeout(() => div.remove(), 3000);
}

// Vérifie si un utilisateur est connecté
function checkLoggedInUser() {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = '/index.html';
    }
    return user;
}

// Initialisation
$(document).ready(async function() {
    data = await fetchData();
    loadEvents();
    loadRegistrations();
    checkLoggedInUser();

    // Afficher les événements sur la page d'accueil
    function loadEvents() {
        const eventList = $('#eventList');
        if (eventList.length) {
            data.events.forEach(event => {
                const availability = event.maxParticipants - event.registered;
                eventList.append(`
                    <div class="col s12 m6">
                        <div class="card glass-effect">
                            <div class="card-content">
                                <span class="card-title">${event.title}</span>
                                <p>Date: ${event.date}</p>
                                <p>Places: ${availability}/${event.maxParticipants}</p>
                            </div>
                        </div>
                    </div>
                `);
            });
        }
    }

    // Afficher les inscriptions dans admin.html
    function loadRegistrations() {
        const studentList = $('#studentList');
        if (studentList.length) {
            studentList.empty();
            data.registrations.forEach((reg, index) => {
                const statusColor = reg.status === 'accepted' ? 'green-text' : reg.status === 'rejected' ? 'red-text' : 'orange-text';
                studentList.append(`
                    <tr>
                        <td>${reg.name}</td>
                        <td>${reg.email}</td>
                        <td>${reg.date || 'Non défini'}</td>
                        <td id="status-${index}" class="${statusColor}">${reg.status}</td>
                        <td>
                            <a href="#statusModal" class="btn-small blue darken-2 waves-effect waves-light modal-trigger tooltipped" 
                               data-tooltip="Modifier statut" onclick="openStatusModal(${index})">
                                <i class="material-icons">edit</i>
                            </a>
                        </td>
                    </tr>
                `);
            });
            // Initialiser les tooltips
            $('.tooltipped').tooltip();
        }
    }

    // Vérifier l'utilisateur connecté
    function checkLoggedInUser() {
        const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
        const currentPage = window.location.pathname;

        if (!user && (currentPage.includes('student-dashboard.html') || currentPage.includes('admin.html'))) {
            alert('Vous devez être connecté.');
            window.location.href = '../index.html';
            return false;
        }

        if (user && currentPage.includes('../student-dashboard.html')) {
            const reg = data.registrations.find(r => r.email === user.email);
            const presenceStatus = $('#presenceStatus');
            const chooseDateButton = $('#chooseDateButton');

            if (reg && reg.date) {
                if (reg.status === 'accepted') {
                    presenceStatus.html(`Statut de votre présence : <span class="text-success">Validée (${reg.date})</span>`);
                    chooseDateButton.text('Modifier ma date');
                    chooseDateButton.prop('disabled', false);
                } else if (reg.status === 'rejected') {
                    presenceStatus.html(`Statut de votre présence : <span class="text-danger">Refusée (${reg.date})</span>`);
                    chooseDateButton.text('Choisir une date');
                    chooseDateButton.prop('disabled', true);
                } else {
                    presenceStatus.html(`Statut de votre présence : <span class="text-warning">En cours de validation (${reg.date})</span>`);
                    chooseDateButton.text('Modifier ma date');
                    chooseDateButton.prop('disabled', true);
                }
            } else {
                presenceStatus.html('Statut de votre présence : <span class="text-warning">Aucune date choisie</span>');
                chooseDateButton.text('Choisir une date');
                chooseDateButton.prop('disabled', false);
            }
        }
        return true;
    }

    // Inscription
    $('#signupForm').on('submit', async function(e) {
        e.preventDefault();
        const email = $('#signupEmail').val();
        const password = $('#signupPassword').val();

        if (!email.endsWith('@laplateforme.io')) {
            alert('Seuls les emails @laplateforme.io sont autorisés.');
            return;
        }

        if (data.users.some(u => u.email === email)) {
            alert('Un compte avec cet email existe déjà.');
            return;
        }

        const newUser = { email, password, role: 'student' };
        data.users.push(newUser);
        data.registrations.push({ name: email.split('@')[0], email, date: '', status: 'pending' });
        await saveData(data);
        sessionStorage.setItem('loggedInUser', JSON.stringify(newUser));
        alert('Inscription réussie !');
        closeModal('signupModal');
        window.location.href = '../student-dashboard.html';
    });

    // Connexion utilisateur
    $('#loginForm').on('submit', async function(e) {
        e.preventDefault();
        const email = $('#email').val();
        const password = $('#password').val();
        const user = data.users.find(u => u.email === email && u.password === password);

        if (!user) {
            alert('Email ou mot de passe incorrect.');
            return;
        }

        sessionStorage.setItem('loggedInUser', JSON.stringify(user));
        alert('Connexion réussie !');
        window.location.href = user.role === 'student' ? '../student-dashboard.html' : '../admin.html';
    });

    // Connexion admin
    $('#adminLoginForm').on('submit', async function(e) {
        e.preventDefault();
        const email = $('#adminEmail').val();
        const password = $('#adminPassword').val();
        const admin = data.users.find(u => u.email === email && u.password === password && u.role === 'admin');

        if (!admin) {
            alert('Email ou mot de passe incorrect.');
            return;
        }

        sessionStorage.setItem('loggedInUser', JSON.stringify(admin));
        alert('Connexion réussie !');
        closeModal('adminLoginModal');
        window.location.href = '../index.html';
    });

    // Confirmation/Modification date
    $('#confirmDate').on('click', async function() {
        const selectedDate = $('#eventDate').val();
        if (!selectedDate) {
            alert('Veuillez sélectionner une date.');
            return;
        }

        const today = new Date('2025-03-21');
        const chosenDate = new Date(selectedDate);
        if (chosenDate < today) {
            alert('Date passée non modifiable.');
            return;
        }

        const event = data.events.find(e => e.date === selectedDate);
        if (!event || event.registered >= event.maxParticipants) {
            alert('Événement complet ou non disponible.');
            return;
        }

        const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
        let reg = data.registrations.find(r => r.email === user.email);

        if (!reg) {
            reg = { name: user.email.split('@')[0], email: user.email, date: selectedDate, status: 'pending' };
            data.registrations.push(reg);
            event.registered++;
        } else {
            if (reg.status === 'accepted' && reg.date !== selectedDate) {
                const oldEvent = data.events.find(e => e.date === reg.date);
                if (oldEvent) oldEvent.registered--;
                event.registered++;
            }
            reg.date = selectedDate;
            reg.status = 'pending';
        }

        await saveData(data);
        showWelcomeAnimation(`Présence enregistrée pour le ${selectedDate} - En cours de validation`);
        closeModal('calendarModal');
        checkLoggedInUser();
    });

    // Déconnexion
    $('#logoutButton').on('click', function() {
        sessionStorage.removeItem('loggedInUser');
        alert('Vous avez été déconnecté.');
        window.location.href = '../admin.html';
    });

    // Ouvrir le modal de statut
    window.openStatusModal = function(index) {
        $('#studentIndex').val(index);
        const currentStatus = data.registrations[index].status;
        $('#statusSelect').val(currentStatus);
        M.FormSelect.init(document.querySelector('#statusSelect')); // Réinitialiser le select
    };

    // Mettre à jour le statut
    $('#statusForm').on('submit', async function(e) {
        e.preventDefault();
        const index = $('#studentIndex').val();
        const status = $('#statusSelect').val();
        data.registrations[index].status = status;
        await saveData(data);
        showToast(`Statut mis à jour : ${status}`);
        closeModal('statusModal');
        loadRegistrations();
    });

    // Mettre à jour le statut (compatibilité avec ancienne méthode)
    window.updateStatus = async function(index, status) {
        data.registrations[index].status = status;
        await saveData(data);
        showToast(`Statut mis à jour : ${status}`);
        loadRegistrations();
    };
});

// Gestion DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    if (currentPage.includes('../student-dashboard.html') || currentPage.includes('../admin.html')) {
        checkLoggedInUser();
    }
    if (currentPage.includes('../admin.html')) {
        loadRegistrations();
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    // Vérifiez que Materialize est bien chargé
    if (typeof M === 'undefined') {
        console.error('Materialize n\'est pas chargé. Vérifiez l\'ordre des scripts.');
        return;
    }

    // Initialisation des modals
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals, { opacity: 0.6 });

    // Initialisation des sélecteurs
    const selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);

    // Initialisation des carousels
    const carousels = document.querySelectorAll('.carousel');
    M.Carousel.init(carousels, { fullWidth: true, indicators: true, duration: 200 });

    // Charger les données JSON
    data = await fetchData();
});