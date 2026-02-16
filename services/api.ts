const API_BASE = '/api'; // Use relative path for proxy

async function handleResponse(res: Response) {
    if (!res.ok) {
        if (res.status === 500) {
            // Try to parse JSON error from specialized config.php handler
            try {
                const errJson = await res.json();
                throw new Error(errJson.error || errJson.message || 'Internal Server Error');
            } catch (e: any) {
                if (e.message && e.message !== 'Internal Server Error') throw e;
                // If not JSON or generic, it might be the proxy failing to reach PHP
                throw new Error('Cannot reach API. Ensure npm run dev:api is running in a separate terminal.');
            }
        }
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

export async function fetchStats() {
    const res = await fetch(`${API_BASE}/dashboard.php`);
    return handleResponse(res);
}

export async function fetchProjects() {
    const res = await fetch(`${API_BASE}/projects.php`);
    return handleResponse(res);
}

export async function fetchProject(id: number) {
    const res = await fetch(`${API_BASE}/projects.php?id=${id}`);
    return handleResponse(res);
}

export async function createProject(data: any) {
    const res = await fetch(`${API_BASE}/projects.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function updateProject(id: number, data: any) {
    const res = await fetch(`${API_BASE}/projects.php?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function deleteProject(id: number) {
    const res = await fetch(`${API_BASE}/projects.php?id=${id}`, { method: 'DELETE' });
    return handleResponse(res);
}

export async function fetchClients() {
    const res = await fetch(`${API_BASE}/clients.php`);
    return handleResponse(res);
}

export async function createClient(data: any) {
    const res = await fetch(`${API_BASE}/clients.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function updateClient(id: number, data: any) {
    const res = await fetch(`${API_BASE}/clients.php?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function deleteClient(id: number) {
    const res = await fetch(`${API_BASE}/clients.php?id=${id}`, { method: 'DELETE' });
    return handleResponse(res);
}

export async function fetchDevelopers() {
    const res = await fetch(`${API_BASE}/developers.php`);
    return handleResponse(res);
}

export async function createDeveloper(data: any) {
    const res = await fetch(`${API_BASE}/add_developer.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function updateDeveloper(id: number, data: any) {
    const res = await fetch(`${API_BASE}/developers.php?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function deleteDeveloper(id: number) {
    const res = await fetch(`${API_BASE}/developers.php?id=${id}`, { method: 'DELETE' });
    return handleResponse(res);
}

export async function fetchPayments(projectId?: number) {
    const url = projectId ? `${API_BASE}/payments.php?project_id=${projectId}` : `${API_BASE}/payments.php`;
    const res = await fetch(url);
    return handleResponse(res);
}

export async function updatePayment(id: number, data: any) {
    const res = await fetch(`${API_BASE}/payments.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
    });
    return handleResponse(res);
}

export async function fetchNotifications() {
    const res = await fetch(`${API_BASE}/notifications.php`);
    return handleResponse(res);
}

export async function markNotificationRead(id?: number) {
    const body = id ? { id } : { mark_all_read: true };
    const res = await fetch(`${API_BASE}/notifications.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return handleResponse(res);
}

export async function fetchSettings() {
    const res = await fetch(`${API_BASE}/settings.php`);
    return handleResponse(res);
}

export async function updateSettings(data: any) {
    const res = await fetch(`${API_BASE}/settings.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}
