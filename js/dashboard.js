document.addEventListener('DOMContentLoaded', async function () {
    // Vérifie si l'utilisateur est connecté
    const user = checkLoggedInUser();
    if (!user || user.role !== 'student') {
        alert('Accès réservé aux étudiants.');
        window.location.href = '/index.html';
        return;
    }

    async function fetchData() {
        try {
            const response = await fetch('/data.json');
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des données JSON :', error);
            return null;
        }
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
