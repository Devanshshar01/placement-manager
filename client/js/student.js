document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const user = Auth.checkRole('student');
    if (!user) return;

    // Set user name in nav
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) userNameEl.textContent = user.name;

    // Determine current page
    const path = window.location.pathname;

    if (path.includes('dashboard.html')) {
        await loadDashboard();
    } else if (path.includes('profile.html')) {
        await loadProfile();
    } else if (path.includes('drives.html')) {
        await loadDrives();
    } else if (path.includes('applications.html')) {
        await loadApplications();
    } else if (path.includes('notifications.html')) {
        await loadNotifications();
    }
});

// --- Dashboard Logic ---
async function loadDashboard() {
    try {
        const [drivesRes, appsRes, notifRes, profileRes] = await Promise.all([
            API.get('/student/drives'),
            API.get('/student/applications'),
            API.get('/student/notifications'),
            API.get('/student/profile')
        ]);

        const drives = drivesRes.data;
        const applications = appsRes.data;
        const notifications = notifRes.data;
        const profile = profileRes.data;

        // Update Stats
        document.getElementById('stat-applied').textContent = applications.length;
        document.getElementById('stat-shortlisted').textContent = applications.filter(a => a.status === 'Shortlisted').length;
        document.getElementById('stat-selected').textContent = applications.filter(a => a.status === 'Selected').length;

        // Profile Completion
        let completion = 0;
        if (profile.resume_url) completion += 25;
        if (profile.linkedin_url) completion += 25;
        if (profile.github_url) completion += 25;
        if (profile.skills && profile.skills.length > 0) completion += 25;

        document.getElementById('profile-percent-text').textContent = `${completion}%`;
        document.getElementById('profile-progress').style.width = `${completion}%`;

        // Render Chart
        const ctx = document.getElementById('applicationChart').getContext('2d');
        const statusCounts = {
            'Applied': 0,
            'Shortlisted': 0,
            'Selected': 0,
            'Rejected': 0
        };
        applications.forEach(app => {
            if (statusCounts[app.status] !== undefined) statusCounts[app.status]++;
        });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Upcoming Drives
        const upcomingList = document.getElementById('upcoming-drives-list');
        const upcoming = drives.slice(0, 3);
        if (upcoming.length === 0) {
            upcomingList.innerHTML = '<p class="text-center text-muted">No upcoming drives.</p>';
        } else {
            upcomingList.innerHTML = upcoming.map(drive => `
                <div class="card p-3 flex justify-between items-center" style="border: 1px solid var(--border); box-shadow: none;">
                    <div>
                        <h4 class="mb-1">${drive.company_name}</h4>
                        <p class="text-sm text-muted">${drive.job_role}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold text-primary">${drive.ctc} LPA</p>
                        <small class="text-muted">${new Date(drive.drive_date).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');
        }

        // Notifications Badge
        const unreadCount = notifications.filter(n => !n.is_read).length;
        if (unreadCount > 0) {
            const badge = document.getElementById('notif-badge');
            badge.textContent = unreadCount;
            badge.style.display = 'block';
        }

    } catch (err) {
        console.error(err);
        Auth.showToast('Failed to load dashboard data', 'error');
    }
}

// --- Profile Logic ---
async function loadProfile() {
    const form = document.getElementById('profile-form');
    const skillsContainer = document.getElementById('skills-container');
    const skillsInput = document.getElementById('skills-input');
    const skillsHidden = document.getElementById('skills-hidden');
    let skills = [];

    try {
        const res = await API.get('/student/profile');
        const data = res.data;

        // Pre-fill
        document.getElementById('name').value = data.name;
        document.getElementById('email').value = data.email;
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('roll_number').value = data.roll_number;
        document.getElementById('branch').value = data.branch;
        document.getElementById('cgpa').value = data.cgpa;
        document.getElementById('resume_url').value = data.resume_url || '';
        document.getElementById('linkedin_url').value = data.linkedin_url || '';
        document.getElementById('github_url').value = data.github_url || '';

        // Skills
        if (data.skills) {
            skills = data.skills.split(',').map(s => s.trim()).filter(s => s);
            renderSkills();
        }

    } catch (err) {
        Auth.showToast('Failed to load profile', 'error');
    }

    // Skills Tag Logic
    function renderSkills() {
        // Clear existing tags except input
        Array.from(skillsContainer.getElementsByClassName('tag')).forEach(el => el.remove());

        skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `
                ${skill}
                <span class="tag-close" onclick="removeSkill('${skill}')">&times;</span>
            `;
            skillsContainer.insertBefore(tag, skillsInput);
        });
        skillsHidden.value = skills.join(',');
    }

    window.removeSkill = (skill) => {
        skills = skills.filter(s => s !== skill);
        renderSkills();
    };

    skillsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.target.value.trim();
            if (val && !skills.includes(val)) {
                skills.push(val);
                renderSkills();
                e.target.value = '';
            }
        }
    });

    // Save Profile
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-btn');
        Auth.setLoading(btn, true);

        const formData = new FormData(form);
        const updateData = {
            phone: formData.get('phone'),
            resume_url: formData.get('resume_url'),
            linkedin_url: formData.get('linkedin_url'),
            github_url: formData.get('github_url'),
            skills: skillsHidden.value
        };

        try {
            await API.put('/student/profile', updateData);
            Auth.showToast('Profile updated successfully', 'success');
        } catch (err) {
            Auth.showToast(err.message, 'error');
        } finally {
            Auth.setLoading(btn, false);
        }
    });
}

// --- Drives Logic ---
async function loadDrives() {
    let allDrives = [];
    let myApplications = [];
    let myCgpa = 0;

    try {
        const [drivesRes, appsRes, profileRes] = await Promise.all([
            API.get('/student/drives'),
            API.get('/student/applications'),
            API.get('/student/profile')
        ]);
        allDrives = drivesRes.data;
        myApplications = appsRes.data;
        myCgpa = parseFloat(profileRes.data.cgpa);

        renderDrives(allDrives);

        // Filter Logic
        document.getElementById('filter-btn').addEventListener('click', () => {
            const search = document.getElementById('search-input').value.toLowerCase();
            const type = document.getElementById('filter-type').value;
            const minCtc = parseFloat(document.getElementById('filter-ctc').value) || 0;

            const filtered = allDrives.filter(d => {
                const matchesSearch = d.company_name.toLowerCase().includes(search) || d.job_role.toLowerCase().includes(search);
                const matchesType = !type || d.job_type === type;
                const matchesCtc = parseFloat(d.ctc) >= minCtc;
                return matchesSearch && matchesType && matchesCtc;
            });
            renderDrives(filtered);
        });

    } catch (err) {
        Auth.showToast('Failed to load drives', 'error');
    }

    function renderDrives(drives) {
        const grid = document.getElementById('drives-grid');
        if (drives.length === 0) {
            grid.innerHTML = '<p class="col-span-2 text-center text-muted">No drives found matching your criteria.</p>';
            return;
        }

        grid.innerHTML = drives.map(drive => {
            const isApplied = myApplications.some(a => a.drive_id === drive.id);
            const isEligible = myCgpa >= parseFloat(drive.min_cgpa);

            let btnState = '';
            if (isApplied) {
                btnState = '<button class="btn btn-success btn-block" disabled>✓ Applied</button>';
            } else if (!isEligible) {
                btnState = '<button class="btn btn-outline btn-block" disabled style="opacity: 0.6; cursor: not-allowed;">Not Eligible</button>';
            } else {
                btnState = `<button onclick="openDriveModal(${drive.id})" class="btn btn-primary btn-block">View & Apply</button>`;
            }

            return `
                <div class="drive-card">
                    <div class="drive-header">
                        <div>
                            <h3 class="text-lg font-bold">${drive.company_name}</h3>
                            <p class="text-primary">${drive.job_role}</p>
                        </div>
                        <div class="company-logo">${drive.company_name.substring(0, 2).toUpperCase()}</div>
                    </div>
                    <div class="drive-meta">
                        <span>💰 ${drive.ctc} LPA</span>
                        <span>📍 ${drive.location || 'Remote'}</span>
                        <span>📅 ${new Date(drive.deadline).toLocaleDateString()}</span>
                        <span>🎓 Min CGPA: ${drive.min_cgpa}</span>
                    </div>
                    <div class="drive-skills">
                        ${drive.skills_required ? drive.skills_required.split(',').slice(0, 3).map(s => `<span class="skill-badge">${s}</span>`).join('') : ''}
                    </div>
                    <div style="margin-top: auto;">
                        ${btnState}
                    </div>
                </div>
            `;
        }).join('');
    }

    window.openDriveModal = (driveId) => {
        const drive = allDrives.find(d => d.id === driveId);
        if (!drive) return;

        document.getElementById('modal-title').textContent = `${drive.job_role} at ${drive.company_name}`;
        document.getElementById('modal-content').innerHTML = `
            <div class="mb-4">
                <h4 class="mb-2">Description</h4>
                <p class="text-muted">${drive.description || 'No description provided.'}</p>
            </div>
            <div class="mb-4">
                <h4 class="mb-2">Requirements</h4>
                <ul class="list-disc pl-4 text-muted">
                    <li>Minimum CGPA: ${drive.min_cgpa}</li>
                    <li>Batch: ${drive.batch}</li>
                    <li>Skills: ${drive.skills_required}</li>
                </ul>
            </div>
            <div class="alert alert-info">
                <strong>Note:</strong> Once applied, you cannot withdraw your application after the deadline.
            </div>
        `;

        const applyBtn = document.getElementById('modal-apply-btn');
        applyBtn.onclick = () => applyToDrive(drive.id);

        document.getElementById('drive-modal').style.display = 'flex';
    };

    async function applyToDrive(driveId) {
        if (!confirm('Are you sure you want to apply for this position?')) return;

        const btn = document.getElementById('modal-apply-btn');
        Auth.setLoading(btn, true);

        try {
            await API.post(`/student/apply/${driveId}`);
            Auth.showToast('Application submitted successfully!', 'success');
            document.getElementById('drive-modal').style.display = 'none';
            loadDrives(); // Reload to update UI
        } catch (err) {
            Auth.showToast(err.message, 'error');
        } finally {
            Auth.setLoading(btn, false);
        }
    }
}

// --- Applications Logic ---
async function loadApplications() {
    let allApps = [];
    let currentFilter = 'All';

    try {
        const res = await API.get('/student/applications');
        allApps = res.data;
        renderApplications();
    } catch (err) {
        Auth.showToast('Failed to load applications', 'error');
    }

    window.filterApps = (status) => {
        currentFilter = status;
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t.textContent.includes(status) || (status === 'All' && t.textContent === 'All Applications'));
        });
        renderApplications();
    };

    window.renderApplications = () => {
        const container = document.getElementById('applications-container');
        const view = window.currentView || 'table'; // From HTML global var

        const filtered = currentFilter === 'All' ? allApps : allApps.filter(a => a.status === currentFilter);

        if (filtered.length === 0) {
            container.innerHTML = '<p class="text-center text-muted p-4">No applications found.</p>';
            return;
        }

        if (view === 'table') {
            container.innerHTML = `
                <table class="app-table">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Job Role</th>
                            <th>Applied Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(app => `
                            <tr>
                                <td>${app.company_name}</td>
                                <td>${app.job_role}</td>
                                <td>${new Date(app.applied_at).toLocaleDateString()}</td>
                                <td><span class="badge badge-${getStatusColor(app.status)}">${app.status}</span></td>
                                <td>
                                    ${app.status === 'Applied' ? `<button onclick="withdrawApp(${app.id})" class="btn btn-outline btn-sm text-danger" style="border-color: var(--danger); color: var(--danger);">Withdraw</button>` : '-'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            // Card View
            container.innerHTML = filtered.map(app => `
                <div class="app-card">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold">${app.company_name}</h3>
                        <span class="badge badge-${getStatusColor(app.status)}">${app.status}</span>
                    </div>
                    <p class="text-primary mb-2">${app.job_role}</p>
                    <p class="text-sm text-muted">Applied: ${new Date(app.applied_at).toLocaleDateString()}</p>
                    
                    <div class="status-timeline">
                        <div class="timeline-dot active"></div>
                        <span>Applied</span>
                        ${app.status !== 'Applied' ? `<div class="timeline-dot active"></div><span>${app.status}</span>` : ''}
                    </div>

                    ${app.status === 'Applied' ? `<button onclick="withdrawApp(${app.id})" class="btn btn-outline btn-sm mt-4 text-danger" style="width: 100%;">Withdraw Application</button>` : ''}
                </div>
            `).join('');
        }
    };

    window.withdrawApp = async (id) => {
        if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
        try {
            await API.delete(`/student/applications/${id}`);
            Auth.showToast('Application withdrawn', 'success');
            // Refresh
            const res = await API.get('/student/applications');
            allApps = res.data;
            renderApplications();
        } catch (err) {
            Auth.showToast(err.message, 'error');
        }
    };

    window.exportPDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text("My Applications Report", 14, 15);

        const tableColumn = ["Company", "Job Role", "Applied Date", "Status"];
        const tableRows = allApps.map(app => [
            app.company_name,
            app.job_role,
            new Date(app.applied_at).toLocaleDateString(),
            app.status
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("my_applications.pdf");
    };

    function getStatusColor(status) {
        switch (status) {
            case 'Selected': return 'success';
            case 'Shortlisted': return 'warning';
            case 'Rejected': return 'danger';
            default: return 'primary';
        }
    }
}

// --- Notifications Logic ---
async function loadNotifications() {
    let allNotifs = [];

    try {
        const res = await API.get('/student/notifications');
        allNotifs = res.data;
        renderNotifications();
    } catch (err) {
        Auth.showToast('Failed to load notifications', 'error');
    }

    function renderNotifications() {
        const container = document.getElementById('notifications-container');
        if (allNotifs.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No notifications.</p>';
            return;
        }

        // Group by Date
        const groups = {
            'Today': [],
            'Yesterday': [],
            'Older': []
        };

        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        allNotifs.forEach(n => {
            const date = new Date(n.created_at).toDateString();
            if (date === today) groups['Today'].push(n);
            else if (date === yesterday) groups['Yesterday'].push(n);
            else groups['Older'].push(n);
        });

        let html = '';
        for (const [group, items] of Object.entries(groups)) {
            if (items.length === 0) continue;
            html += `<h4 class="notif-group-title">${group}</h4>`;
            html += items.map(n => `
                <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="markRead(${n.id}, this)">
                    <div class="notif-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path></svg>
                    </div>
                    <div class="notif-content">
                        <p>${n.message}</p>
                        <p class="notif-time">${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            `).join('');
        }
        container.innerHTML = html;
    }

    window.markRead = async (id, el) => {
        if (!el.classList.contains('unread')) return;
        // In a real app, we'd call an API. For now, just UI update as API might not exist for single read
        // Assuming we might have an endpoint or just simulate
        el.classList.remove('unread');
        // Optionally call API if exists
    };

    window.markAllRead = () => {
        document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
        Auth.showToast('All notifications marked as read', 'success');
    };
}
