document.addEventListener('DOMContentLoaded', async function () {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user || user.role !== 'admin') {
        window.location.href = './index.html';
        return;
    }

    let data = {};
    let updateInterval;

    async function fetchData() {
        try {
            const response = await fetch('./data/data.json?t=' + Date.now());
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des données JSON :', error);
            return null;
        }
    }

    async function saveData(updatedData) {
        // Ici vous pourriez envoyer les données au serveur
        console.log('Sauvegarde des données:', updatedData);
        data = updatedData;
        loadRegistrations();
        showToast('Données mises à jour avec succès');
    }

    function showToast(message, type = 'success') {
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
        
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, 3000);
    }

    data = await fetchData();
    if (!data) return;

    function loadRegistrations() {
        const studentList = document.getElementById('studentList');
        if (!studentList || !data.registrations) return;

        studentList.innerHTML = '';
        
        data.registrations.forEach((registration, index) => {
            const statusClass = registration.status === 'accepted' ? 'text-success' : 
                              registration.status === 'rejected' ? 'text-danger' : 'text-warning';
            const statusText = registration.status === 'accepted' ? 'Accepté' : 
                             registration.status === 'rejected' ? 'Refusé' : 'En attente';
            const statusIcon = registration.status === 'accepted' ? 'fa-check-circle' : 
                             registration.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';

            // Trouver l'événement correspondant
            const event = data.events.find(e => e.id === registration.eventId);
            const eventTitle = event ? event.title : 'Événement inconnu';

            const row = document.createElement('tr');
            row.className = 'animate-fade-in';
            row.style.animationDelay = `${index * 0.1}s`;
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-user-circle fa-lg text-primary me-2"></i>
                        <div>
                            <strong>${registration.name}</strong>
                            <br>
                            <small class="text-muted">${registration.email}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${eventTitle}</strong>
                        <br>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            ${formatDate(registration.date)}
                        </small>
                    </div>
                </td>
                <td>
                    <span class="badge ${getStatusBadgeClass(registration.status)} d-flex align-items-center">
                        <i class="fas ${statusIcon} me-1"></i>
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-success btn-sm ${registration.status === 'accepted' ? 'disabled' : ''}" 
                                onclick="updateStatus(${index}, 'accepted')"
                                ${registration.status === 'accepted' ? 'disabled' : ''}>
                            <i class="fas fa-check me-1"></i>Accepter
                        </button>
                        <button class="btn btn-danger btn-sm ${registration.status === 'rejected' ? 'disabled' : ''}" 
                                onclick="updateStatus(${index}, 'rejected')"
                                ${registration.status === 'rejected' ? 'disabled' : ''}>
                            <i class="fas fa-times me-1"></i>Refuser
                        </button>
                        ${registration.status !== 'pending' ? `
                            <button class="btn btn-warning btn-sm" onclick="updateStatus(${index}, 'pending')">
                                <i class="fas fa-undo me-1"></i>Remettre en attente
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;
            studentList.appendChild(row);
        });
        
        updateStatistics();
    }

    function getStatusBadgeClass(status) {
        switch(status) {
            case 'accepted': return 'bg-success';
            case 'rejected': return 'bg-danger';
            default: return 'bg-warning';
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function updateStatistics() {
        if (!data.registrations) return;
        
        const stats = data.registrations.reduce((acc, reg) => {
            acc.total++;
            acc[reg.status] = (acc[reg.status] || 0) + 1;
            return acc;
        }, { total: 0, pending: 0, accepted: 0, rejected: 0 });
        
        // Mettre à jour les éléments d'interface si ils existent
        const totalElement = document.getElementById('totalRegistrations');
        const pendingElement = document.getElementById('pendingRegistrations');
        const acceptedElement = document.getElementById('acceptedRegistrations');
        const rejectedElement = document.getElementById('rejectedRegistrations');
        
        if (totalElement) totalElement.textContent = stats.total;
        if (pendingElement) pendingElement.textContent = stats.pending;
        if (acceptedElement) acceptedElement.textContent = stats.accepted;
        if (rejectedElement) rejectedElement.textContent = stats.rejected;
    }

    window.updateStatus = async function (index, status) {
        if (!data.registrations || !data.registrations[index]) {
            showToast('Erreur: inscription non trouvée', 'error');
            return;
        }
        
        const registration = data.registrations[index];
        const oldStatus = registration.status;
        registration.status = status;
        
        // Mettre à jour les statistiques d'événements
        if (oldStatus === 'accepted' && status !== 'accepted') {
            // Diminuer le nombre d'inscrits
            const event = data.events.find(e => e.id === registration.eventId);
            if (event && event.registered > 0) {
                event.registered--;
            }
        } else if (oldStatus !== 'accepted' && status === 'accepted') {
            // Augmenter le nombre d'inscrits
            const event = data.events.find(e => e.id === registration.eventId);
            if (event && event.registered < event.maxParticipants) {
                event.registered++;
            }
        }
        
        await saveData(data);
        
        const statusText = status === 'accepted' ? 'accepté' : 
                          status === 'rejected' ? 'refusé' : 'remis en attente';
        showToast(`Statut de ${registration.name} mis à jour : ${statusText}`);
    };

    // Mise à jour automatique des données
    function startRealTimeUpdates() {
        updateInterval = setInterval(async () => {
            const newData = await fetchData();
            if (newData && JSON.stringify(newData) !== JSON.stringify(data)) {
                data = newData;
                loadRegistrations();
                console.log('Données admin mises à jour automatiquement');
            }
        }, 30000); // Mise à jour toutes les 30 secondes
    }

    function stopRealTimeUpdates() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    }

    // Démarrer les mises à jour en temps réel
    startRealTimeUpdates();

    loadRegistrations();
    
    document.getElementById('logoutButton')?.addEventListener('click', function () {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            stopRealTimeUpdates();
            sessionStorage.removeItem('loggedInUser');
            showToast('Vous avez été déconnecté.');
            setTimeout(() => {
                window.location.href = './index.html';
            }, 1000);
        }
    });

    // Nettoyage lors du déchargement de la page
    window.addEventListener('beforeunload', function() {
        stopRealTimeUpdates();
    });
});
