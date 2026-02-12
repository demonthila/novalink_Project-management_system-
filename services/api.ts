const API_BASE = 'http://localhost:8000/api'; // Change in production

export async function fetchStats() {
    const res = await fetch(`${API_BASE}/dashboard.php`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
}

export async function fetchProjects() {
    const res = await fetch(`${API_BASE}/projects.php`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
}

export async function fetchProject(id: number) {
    const res = await fetch(`${API_BASE}/projects.php?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
}

export async function createProject(data: any) {
    const res = await fetch(`${API_BASE}/projects.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function updateProject(id: number, data: any) {
    const res = await fetch(`${API_BASE}/projects.php?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deleteProject(id: number) {
    const res = await fetch(`${API_BASE}/projects.php?id=${id}`, { method: 'DELETE' });
    return res.json();
}

export async function fetchClients() {
    const res = await fetch(`${API_BASE}/clients.php`);
    return res.json();
}

export async function createClient(data: any) {
    const res = await fetch(`${API_BASE}/clients.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function fetchDevelopers() {
    const res = await fetch(`${API_BASE}/developers.php`);
    return res.json();
}

export async function createDeveloper(data: any) {
    const res = await fetch(`${API_BASE}/developers.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function fetchPayments(projectId?: number) {
    const url = projectId ? `${API_BASE}/payments.php?project_id=${projectId}` : `${API_BASE}/payments.php`;
    const res = await fetch(url);
    return res.json();
}

export async function updatePayment(id: number, data: any) {
    const res = await fetch(`${API_BASE}/payments.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
    });
    return res.json();
}

export async function fetchNotifications() {
    const res = await fetch(`${API_BASE}/notifications.php`);
    return res.json();
}

export async function markNotificationRead(id?: number) {
    const body = id ? { id } : { mark_all_read: true };
    const res = await fetch(`${API_BASE}/notifications.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}

export async function fetchSettings() {
    const res = await fetch(`${API_BASE}/settings.php`);
    return res.json();
}

export async function updateSettings(data: any) {
    const res = await fetch(`${API_BASE}/settings.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}
