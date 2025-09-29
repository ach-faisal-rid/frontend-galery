// Application config helper
// Exposes APP_BASE, API_BASE and apiFetch(url, opts)
(function () {
    // Detect base path from current location pathname.
    // Example: /smkti/gallery-app/frontend-galery/index.html -> '/smkti/gallery-app/frontend-galery'
    const pathParts = window.location.pathname.split('/');
    // remove last part (file) if present
    pathParts.pop();
    const APP_BASE = pathParts.join('/') || '';

    // API base: prefer same origin + project root backend path, fallback to localhost
    // We want to point to the repository's backend folder (e.g. /smkti/gallery-app/backend/api)
    const API_BASE = (function () {
        try {
            const origin = window.location.origin;
            if (origin && origin !== 'null' && !origin.startsWith('file://')) {
                // Attempt to derive project root (up to '/gallery-app') from the pathname.
                // Example pathname: '/smkti/gallery-app/frontend-galery/index.html' -> projectRoot = '/smkti/gallery-app'
                const pathname = window.location.pathname || '';
                const m = pathname.match(/(.*\/gallery-app)/);
                const projectRoot = m ? m[1] : APP_BASE; // fallback to APP_BASE if not found
                return `${origin}${projectRoot}/backend/api`;
            }
        } catch (e) {
            // ignore
        }
        return 'http://localhost/smkti/gallery-app/backend/api';
    })();

    function apiFetch(path, options = {}) {
        const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
        const token = localStorage.getItem('token');
        const headers = Object.assign({}, options.headers || {});
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';

        const opts = Object.assign({}, options, { headers });
        return fetch(url, opts);
    }

    window.APP_BASE = APP_BASE;
    window.API_BASE = API_BASE;
    window.apiFetch = apiFetch;
    console.log('app-config: APP_BASE=', APP_BASE, 'API_BASE=', API_BASE);
})();
