document.addEventListener('DOMContentLoaded', async function () {
    // Vérifier la connexion utilisateur
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user || user.role !== 'student') {
        window.location.href = './index.html';
        return;
    }

    // Charger les données
    async function fetchData() {
        try {
            const response = await fetch('./data/data.json');
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des données JSON :', error);
            return null;
        }
    }

    function showToast(message, type = 'success') {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const alertElement = document.createElement('div');
        alertElement.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        alertElement.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertElement.innerHTML = `
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

    const data = await fetchData();
    if (!data) return;

    function loadEvents() {
        const eventList = document.getElementById('eventList');
        if (!eventList) return;

        eventList.innerHTML = '';
        data.events.forEach(event => {
            const availability = event.maxParticipants - event.registered;
            eventList.innerHTML += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${event.title}</h5>
                            <p class="card-text">Date: ${event.date}</p>
                            <p class="card-text">Places restantes: ${availability}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    loadEvents();

    // Autres fonctionnalités spécifiques à la page étudiant
    document.getElementById('confirmDate').addEventListener('click', function () {
        const selectedDate = document.getElementById('eventDate').value;
        if (!selectedDate) {
            alert('Veuillez sélectionner une date.');
            return;
        }
        alert(`Date confirmée : ${selectedDate}`);
        // Ajoutez ici la logique pour enregistrer la date
    });
});
