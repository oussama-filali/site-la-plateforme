document.addEventListener('DOMContentLoaded', async function () {
    // Charger les données JSON
    async function fetchData() {
        try {
            const response = await fetch('./data/data.json?t=' + Date.now());
            if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des données JSON :', error);
            return null;
        }
    }

    // Fonction pour afficher les notifications
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

    // Gestion de la connexion admin uniquement (les autres sont gérées par script.js)
    document.getElementById('adminLoginForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        const data = await fetchData();
        if (!data) {
            showToast('Impossible de charger les données.', 'error');
            return;
        }

        const admin = data.users.find(user => user.email === email && user.password === password && user.role === 'admin');
        if (!admin) {
            showToast('Email ou mot de passe incorrect.', 'error');
            return;
        }

        sessionStorage.setItem('loggedInUser', JSON.stringify(admin));
        showToast('Connexion admin réussie !');
        
        // Fermer le modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('adminLoginModal'));
        modal.hide();
        
        setTimeout(() => {
            window.location.href = './admin.html';
        }, 1000);
    });

    // Gestion de la déconnexion
    document.getElementById('logoutButton')?.addEventListener('click', function () {
        sessionStorage.removeItem('loggedInUser');
        showToast('Vous avez été déconnecté.');
        setTimeout(() => {
            window.location.href = './index.html';
        }, 1000);
    });
});
