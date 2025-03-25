document.addEventListener('DOMContentLoaded', async function () {
    // Charger les données JSON
    async function fetchData() {
        try {
            const response = await fetch('/data.json');
            if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des données JSON :', error);
            return null;
        }
    }

    // Gestion de la connexion admin
    document.getElementById('adminLoginForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        const data = await fetchData();
        if (!data) {
            showToast('Impossible de charger les données.', 'red darken-2');
            return;
        }

        const admin = data.users.find(user => user.email === email && user.password === password && user.role === 'admin');
        if (!admin) {
            showToast('Email ou mot de passe incorrect.', 'red darken-2');
            return;
        }

        sessionStorage.setItem('loggedInUser', JSON.stringify(admin));
        showToast('Connexion réussie !');
        window.location.href = '/admin.html';
    });

    // Gestion de la déconnexion
    document.getElementById('logoutButton')?.addEventListener('click', function () {
        sessionStorage.removeItem('loggedInUser');
        showToast('Vous avez été déconnecté.');
        window.location.href = '/index.html';
    });
});
