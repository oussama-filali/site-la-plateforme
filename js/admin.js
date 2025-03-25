document.addEventListener('DOMContentLoaded', async function () {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user || user.role !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    async function fetchData() {
        try {
            const response = await fetch('../data/data.json');
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des données JSON :', error);
            return null;
        }
    }

    const data = await fetchData();
    if (!data) return;

    function loadRegistrations() {
        const studentList = document.getElementById('studentList');
        if (!studentList) return;

        studentList.innerHTML = '';
        data.registrations.forEach((reg, index) => {
            const user = data.users.find(u => u.userId === reg.userId);
            const event = data.events.find(e => e.id === reg.eventId);

            studentList.innerHTML += `
                <tr>
                    <td>${user.email}</td>
                    <td>${event ? event.date : 'Non défini'}</td>
                    <td id="status-${index}">${reg.status}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="updateStatus(${index}, 'accepted')">Accepter</button>
                        <button class="btn btn-danger btn-sm" onclick="updateStatus(${index}, 'rejected')">Refuser</button>
                    </td>
                </tr>
            `;
        });
    }

    window.updateStatus = async function (index, status) {
        data.registrations[index].status = status;
        showToast(`Statut mis à jour : ${status}`);
        loadRegistrations();
    };

    loadRegistrations();
    
    document.getElementById('logoutButton')?.addEventListener('click', function () {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            sessionStorage.removeItem('loggedInUser');
            alert('Vous avez été déconnecté.');
            window.location.href = '../index.html';
        }
    });
});
 // Initialisation de Materialize
 document.addEventListener('DOMContentLoaded', function () {
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals, { opacity: 0.6 });

    const selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);

    const carousels = document.querySelectorAll('.carousel');
    M.Carousel.init(carousels, { fullWidth: true, indicators: true, duration: 200 });

    // Auto-rotation du carousel
    setInterval(() => {
        const instance = M.Carousel.getInstance(document.querySelector('.carousel'));
        instance.next();
    }, 5000);
});