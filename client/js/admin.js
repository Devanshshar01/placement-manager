document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const user = Auth.checkRole('admin');
    if (!user) return;

    // Set user name
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) userNameEl.textContent = user.name;

    // Determine current page
    const path = window.location.pathname;

    if (path.includes('dashboard.html')) {
        await loadDashboard();
    } else if (path.includes('students.html')) {
        await loadStudents();
    } else if (path.includes('companies.html')) {
        await loadCompanies();
    } else if (path.includes('drives.html')) {
        await loadDrives();
    } else if (path.includes('applications.html')) {
        await loadApplications();
    }
});

// ... [Keep existing Dashboard, Students, Companies, Drives logic unchanged] ...
// I will append the new Applications logic and keep the rest.
// Since I must replace the file content, I need to include the previous logic too.
// For brevity in this tool call, I will re-include the previous functions and add the new one.

// --- Dashboard Logic ---
async function loadDashboard() {
    try {
        const analytics = await API.get('/admin/analytics');
        const data = analytics.data;

        document.getElementById('total-students').textContent = data.total_students;
        document.getElementById('active-drives').textContent = data.total_drives;
        document.getElementById('total-applications').textContent = data.total_applications;
        document.getElementById('placement-rate').textContent = data.placement_rate + '%';

        renderCharts(data);

        const activityFeed = document.getElementById('activity-feed');
        if (data.top_companies.length > 0) {
            activityFeed.innerHTML = data.top_companies.map(c => `
                <div class="activity-item">
                    <div class="activity-icon">🏢</div>
                    <div>
                        <p><strong>${c.company_name}</strong> selected <strong>${c.selected_count}</strong> students.</p>
                        <small class="text-muted">Recently</small>
                    </div>
                </div>
            `).join('');
        } else {
            activityFeed.innerHTML = '<p class="text-center text-muted">No recent activity.</p>';
        }
    } catch (err) {
        console.error(err);
        Auth.showToast('Failed to load analytics', 'error');
    }
    setInterval(loadDashboard, 60000);
}

function renderCharts(data) {
    const ctx1 = document.getElementById('appsPerDriveChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: data.top_companies.map(c => c.company_name),
                datasets: [{
                    label: 'Selections',
                    data: data.top_companies.map(c => c.selected_count),
                    backgroundColor: '#3b82f6'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    const ctx2 = document.getElementById('branchDistChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: ['CS', 'IT', 'ECE', 'Mech', 'Civil'],
                datasets: [{
                    data: [40, 30, 15, 10, 5],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

window.exportAnalytics = () => {
    const data = [
        ['Metric', 'Value'],
        ['Total Students', document.getElementById('total-students').textContent],
        ['Active Drives', document.getElementById('active-drives').textContent],
        ['Total Applications', document.getElementById('total-applications').textContent],
        ['Placement Rate', document.getElementById('placement-rate').textContent]
    ];
    let csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analytics_report.csv");
    document.body.appendChild(link);
    link.click();
};

// --- Students Logic ---
async function loadStudents() {
    let allStudents = [];
    try {
        const res = await API.get('/admin/students');
        allStudents = res.data;
        renderStudents(allStudents);
    } catch (err) {
        Auth.showToast('Failed to load students', 'error');
    }

    document.getElementById('filter-btn').addEventListener('click', () => {
        const search = document.getElementById('search-input').value.toLowerCase();
        const branch = document.getElementById('filter-branch').value;
        const minCgpa = parseFloat(document.getElementById('filter-cgpa').value) || 0;

        const filtered = allStudents.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(search) ||
                s.roll_number.toLowerCase().includes(search) ||
                s.email.toLowerCase().includes(search);
            const matchesBranch = !branch || s.branch === branch;
            const matchesCgpa = parseFloat(s.cgpa) >= minCgpa;
            return matchesSearch && matchesBranch && matchesCgpa;
        });
        renderStudents(filtered);
    });

    function renderStudents(students) {
        const tbody = document.getElementById('students-table-body');
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">No students found.</td></tr>';
            return;
        }
        tbody.innerHTML = students.map(s => `
            <tr>
                <td>${s.roll_number}</td>
                <td>${s.name}</td>
                <td>${s.branch}</td>
                <td>${s.cgpa}</td>
                <td>${s.application_count || 0}</td>
                <td>${s.resume_url ? `<a href="${s.resume_url}" target="_blank" class="text-primary">Link</a>` : '-'}</td>
                <td><button onclick="viewStudent(${s.id})" class="btn btn-outline btn-sm">View</button></td>
            </tr>
        `).join('');
    }

    window.viewStudent = async (id) => {
        try {
            const res = await API.get(`/admin/students/${id}`);
            const s = res.data;
            document.getElementById('modal-title').textContent = s.name;
            document.getElementById('modal-content').innerHTML = `
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div><p class="text-sm text-muted">Roll Number</p><p class="font-bold">${s.roll_number}</p></div>
                    <div><p class="text-sm text-muted">Branch</p><p class="font-bold">${s.branch}</p></div>
                    <div><p class="text-sm text-muted">Email</p><p class="font-bold">${s.email}</p></div>
                    <div><p class="text-sm text-muted">Phone</p><p class="font-bold">${s.phone || '-'}</p></div>
                    <div><p class="text-sm text-muted">CGPA</p><p class="font-bold">${s.cgpa}</p></div>
                </div>
                <h4 class="mb-2">Skills</h4>
                <div class="flex gap-2 flex-wrap mb-4">
                    ${s.skills ? s.skills.split(',').map(skill => `<span class="badge badge-primary">${skill.trim()}</span>`).join('') : '<p class="text-muted">No skills listed</p>'}
                </div>
                <h4 class="mb-2">Links</h4>
                <div class="flex gap-4 mb-4">
                    ${s.resume_url ? `<a href="${s.resume_url}" target="_blank" class="text-primary">Resume</a>` : ''}
                    ${s.linkedin_url ? `<a href="${s.linkedin_url}" target="_blank" class="text-primary">LinkedIn</a>` : ''}
                    ${s.github_url ? `<a href="${s.github_url}" target="_blank" class="text-primary">GitHub</a>` : ''}
                </div>
            `;
            document.getElementById('student-modal').style.display = 'flex';
        } catch (err) {
            Auth.showToast('Failed to load student details', 'error');
        }
    };

    window.exportStudents = () => {
        const header = ['Roll No', 'Name', 'Email', 'Branch', 'CGPA', 'Phone'];
        const rows = allStudents.map(s => [s.roll_number, s.name, s.email, s.branch, s.cgpa, s.phone]);
        let csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "students_list.csv");
        document.body.appendChild(link);
        link.click();
    };
}

// --- Companies Logic ---
async function loadCompanies() {
    let allCompanies = [];
    try {
        const res = await API.get('/admin/companies');
        allCompanies = res.data;
        renderCompanies(allCompanies);
    } catch (err) {
        Auth.showToast('Failed to load companies', 'error');
    }

    document.getElementById('search-input').addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const filtered = allCompanies.filter(c => c.company_name.toLowerCase().includes(search));
        renderCompanies(filtered);
    });

    function renderCompanies(companies) {
        const grid = document.getElementById('companies-grid');
        if (companies.length === 0) {
            grid.innerHTML = '<p class="col-span-2 text-center text-muted">No companies found.</p>';
            return;
        }
        grid.innerHTML = companies.map(c => `
            <div class="company-card">
                <div class="company-header">
                    <div class="company-logo">${c.company_name.substring(0, 2).toUpperCase()}</div>
                    <div><h3 class="font-bold text-lg">${c.company_name}</h3><p class="text-muted text-sm">${c.industry || 'Industry N/A'}</p></div>
                </div>
                <div class="company-info">
                    <p>📍 ${c.location || 'Location N/A'}</p>
                    <p>🌐 ${c.website ? `<a href="${c.website}" target="_blank">${c.website}</a>` : 'N/A'}</p>
                    <p>👤 ${c.hr_name || 'HR N/A'}</p>
                </div>
                <div class="company-actions">
                    <button onclick="editCompany(${c.id})" class="btn btn-outline btn-sm" style="flex: 1;">Edit</button>
                    <button onclick="deleteCompany(${c.id})" class="btn btn-outline btn-sm text-danger" style="border-color: var(--danger); color: var(--danger); flex: 1;">Delete</button>
                </div>
            </div>
        `).join('');
    }

    window.openCompanyModal = () => {
        document.getElementById('company-form').reset();
        document.getElementById('company-id').value = '';
        document.getElementById('modal-title').textContent = 'Add Company';
        document.getElementById('company-modal').style.display = 'flex';
    };
    window.closeCompanyModal = () => { document.getElementById('company-modal').style.display = 'none'; };

    window.editCompany = (id) => {
        const c = allCompanies.find(x => x.id === id);
        if (!c) return;
        document.getElementById('company-id').value = c.id;
        document.getElementById('company_name').value = c.company_name;
        document.getElementById('industry').value = c.industry || '';
        document.getElementById('website').value = c.website || '';
        document.getElementById('description').value = c.description || '';
        document.getElementById('location').value = c.location || '';
        document.getElementById('hr_name').value = c.hr_name || '';
        document.getElementById('hr_email').value = c.hr_email || '';
        document.getElementById('hr_phone').value = c.hr_phone || '';
        document.getElementById('modal-title').textContent = 'Edit Company';
        document.getElementById('company-modal').style.display = 'flex';
    };

    window.deleteCompany = async (id) => {
        if (!confirm('Are you sure? This will delete all associated drives and applications.')) return;
        try {
            await API.delete(`/admin/companies/${id}`);
            Auth.showToast('Company deleted', 'success');
            loadCompanies();
        } catch (err) {
            Auth.showToast(err.message, 'error');
        }
    };

    document.getElementById('company-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-btn');
        Auth.setLoading(btn, true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const id = data.id;
        delete data.id;
        try {
            if (id) {
                await API.put(`/admin/companies/${id}`, data);
                Auth.showToast('Company updated', 'success');
            } else {
                await API.post('/admin/companies', data);
                Auth.showToast('Company added', 'success');
            }
            closeCompanyModal();
            loadCompanies();
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
    let companies = [];
    try {
        const [drivesRes, companiesRes] = await Promise.all([
            API.get('/admin/drives'),
            API.get('/admin/companies')
        ]);
        allDrives = drivesRes.data;
        companies = companiesRes.data;
        renderDrives(allDrives);
        populateCompanySelect(companies);
    } catch (err) {
        Auth.showToast('Failed to load data', 'error');
    }

    function populateCompanySelect(companies) {
        const select = document.getElementById('company_id');
        select.innerHTML = '<option value="">Select Company</option>' +
            companies.map(c => `<option value="${c.id}">${c.company_name}</option>`).join('');
    }

    document.getElementById('filter-btn').addEventListener('click', () => {
        const search = document.getElementById('search-input').value.toLowerCase();
        const status = document.getElementById('filter-status').value;
        const filtered = allDrives.filter(d => {
            const matchesSearch = d.company_name.toLowerCase().includes(search) || d.job_role.toLowerCase().includes(search);
            const matchesStatus = !status || d.status === status;
            return matchesSearch && matchesStatus;
        });
        renderDrives(filtered);
    });

    function renderDrives(drives) {
        const tbody = document.getElementById('drives-table-body');
        if (drives.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">No drives found.</td></tr>';
            return;
        }
        tbody.innerHTML = drives.map(d => `
            <tr>
                <td>${d.company_name}</td>
                <td>${d.job_role}</td>
                <td>${d.job_type}</td>
                <td>${d.ctc} LPA</td>
                <td>${new Date(d.deadline).toLocaleDateString()}</td>
                <td><span class="badge badge-${d.status === 'Active' ? 'success' : (d.status === 'Completed' ? 'primary' : 'danger')}">${d.status}</span></td>
                <td>
                    <button onclick="editDrive(${d.id})" class="btn btn-outline btn-sm">Edit</button>
                    <button onclick="deleteDrive(${d.id})" class="btn btn-outline btn-sm text-danger" style="border-color: var(--danger); color: var(--danger);">Del</button>
                </td>
            </tr>
        `).join('');
    }

    const skillsContainer = document.getElementById('skills-container');
    const skillsInput = document.getElementById('skills-input');
    const skillsHidden = document.getElementById('skills-hidden');
    let skills = [];

    function renderSkills() {
        Array.from(skillsContainer.getElementsByClassName('tag')).forEach(el => el.remove());
        skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `${skill}<span class="tag-close" onclick="removeSkill('${skill}')">&times;</span>`;
            skillsContainer.insertBefore(tag, skillsInput);
        });
        skillsHidden.value = skills.join(',');
    }

    window.removeSkill = (skill) => { skills = skills.filter(s => s !== skill); renderSkills(); };
    skillsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.target.value.trim();
            if (val && !skills.includes(val)) { skills.push(val); renderSkills(); e.target.value = ''; }
        }
    });

    window.openDriveModal = () => {
        document.getElementById('drive-form').reset();
        document.getElementById('drive-id').value = '';
        skills = []; renderSkills();
        document.getElementById('modal-title').textContent = 'Create Drive';
        document.getElementById('drive-modal').style.display = 'flex';
    };
    window.closeDriveModal = () => { document.getElementById('drive-modal').style.display = 'none'; };

    window.editDrive = (id) => {
        const d = allDrives.find(x => x.id === id);
        if (!d) return;
        document.getElementById('drive-id').value = d.id;
        document.getElementById('company_id').value = d.company_id;
        document.getElementById('job_role').value = d.job_role;
        document.getElementById('job_type').value = d.job_type;
        document.getElementById('ctc').value = d.ctc;
        document.getElementById('location').value = d.location;
        document.getElementById('description').value = d.description;
        document.getElementById('min_cgpa').value = d.min_cgpa;
        document.getElementById('batch').value = d.batch;

        const deadline = new Date(d.deadline);
        deadline.setMinutes(deadline.getMinutes() - deadline.getTimezoneOffset());
        document.getElementById('deadline').value = deadline.toISOString().slice(0, 16);

        const driveDate = new Date(d.drive_date);
        driveDate.setMinutes(driveDate.getMinutes() - driveDate.getTimezoneOffset());
        document.getElementById('drive_date').value = driveDate.toISOString().slice(0, 16);

        skills = d.skills_required ? d.skills_required.split(',').map(s => s.trim()) : [];
        renderSkills();
        document.getElementById('modal-title').textContent = 'Edit Drive';
        document.getElementById('drive-modal').style.display = 'flex';
    };

    window.deleteDrive = async (id) => {
        if (!confirm('Are you sure? This will delete all applications for this drive.')) return;
        try {
            await API.delete(`/admin/drives/${id}`);
            Auth.showToast('Drive deleted', 'success');
            loadDrives();
        } catch (err) {
            Auth.showToast(err.message, 'error');
        }
    };

    document.getElementById('drive-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-btn');
        Auth.setLoading(btn, true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const id = data.id;
        delete data.id;
        try {
            if (id) {
                await API.put(`/admin/drives/${id}`, data);
                Auth.showToast('Drive updated', 'success');
            } else {
                await API.post('/admin/drives', data);
                Auth.showToast('Drive created', 'success');
            }
            closeDriveModal();
            loadDrives();
        } catch (err) {
            Auth.showToast(err.message, 'error');
        } finally {
            Auth.setLoading(btn, false);
        }
    });
}

// --- Applications Logic ---
async function loadApplications() {
    let allApps = [];
    let companies = [];
    let drives = [];

    try {
        const [appsRes, companiesRes, drivesRes] = await Promise.all([
            API.get('/admin/applications'),
            API.get('/admin/companies'),
            API.get('/admin/drives')
        ]);
        allApps = appsRes.data;
        companies = companiesRes.data;
        drives = drivesRes.data;

        populateFilters(companies, drives);
        renderApplications(allApps);
    } catch (err) {
        Auth.showToast('Failed to load applications', 'error');
    }

    function populateFilters(companies, drives) {
        document.getElementById('filter-company').innerHTML = '<option value="">All Companies</option>' +
            companies.map(c => `<option value="${c.id}">${c.company_name}</option>`).join('');

        document.getElementById('filter-drive').innerHTML = '<option value="">All Drives</option>' +
            drives.map(d => `<option value="${d.id}">${d.job_role} (${d.company_name})</option>`).join('');
    }

    document.getElementById('apply-filters').addEventListener('click', () => {
        const companyId = document.getElementById('filter-company').value;
        const driveId = document.getElementById('filter-drive').value;
        const status = document.getElementById('filter-status').value;
        const branch = document.getElementById('filter-branch').value;
        const minCgpa = parseFloat(document.getElementById('filter-cgpa').value) || 0;

        const filtered = allApps.filter(a => {
            const matchesCompany = !companyId || a.company_id == companyId;
            const matchesDrive = !driveId || a.drive_id == driveId;
            const matchesStatus = !status || a.status === status;
            const matchesBranch = !branch || a.branch === branch;
            const matchesCgpa = parseFloat(a.cgpa) >= minCgpa;
            return matchesCompany && matchesDrive && matchesStatus && matchesBranch && matchesCgpa;
        });
        renderApplications(filtered);
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
        document.querySelectorAll('.filter-panel select, .filter-panel input').forEach(el => el.value = '');
        renderApplications(allApps);
    });

    // Bulk Selection Logic
    const selectAll = document.getElementById('select-all');
    selectAll.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.app-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        updateBulkToolbar();
    });

    function updateBulkToolbar() {
        const selected = document.querySelectorAll('.app-checkbox:checked').length;
        const toolbar = document.getElementById('bulk-toolbar');
        document.getElementById('selected-count').textContent = selected;
        if (selected > 0) toolbar.classList.add('active');
        else toolbar.classList.remove('active');
    }

    function renderApplications(apps) {
        const tbody = document.getElementById('apps-table-body');
        document.getElementById('total-count').textContent = apps.length;
        document.getElementById('showing-range').textContent = apps.length > 0 ? `1-${apps.length}` : '0-0';

        if (apps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">No applications found.</td></tr>';
            return;
        }

        tbody.innerHTML = apps.map(a => `
            <tr>
                <td><input type="checkbox" class="app-checkbox" value="${a.id}" onchange="updateBulkToolbar()"></td>
                <td>
                    <div class="font-bold">${a.student_name}</div>
                    <div class="text-sm text-muted">${a.roll_number}</div>
                </td>
                <td>
                    <div>${a.branch}</div>
                    <div class="text-sm text-muted">CGPA: ${a.cgpa}</div>
                </td>
                <td>
                    <div class="font-bold">${a.company_name}</div>
                    <div class="text-sm text-primary">${a.job_role}</div>
                </td>
                <td>${new Date(a.applied_at).toLocaleDateString()}</td>
                <td><span class="badge badge-${getStatusColor(a.status)}">${a.status}</span></td>
                <td>
                    <button onclick="viewApplication(${a.id})" class="btn btn-outline btn-sm">View</button>
                </td>
            </tr>
        `).join('');

        // Re-attach event listener for checkboxes since we re-rendered
        document.querySelectorAll('.app-checkbox').forEach(cb => {
            cb.addEventListener('change', updateBulkToolbar);
        });
    }

    window.updateBulkToolbar = updateBulkToolbar; // Expose to global for inline onclick

    window.viewApplication = async (id) => {
        const app = allApps.find(a => a.id === id);
        if (!app) return;

        document.getElementById('modal-title').textContent = 'Application Details';

        // Skills matching logic
        const requiredSkills = app.skills_required ? app.skills_required.split(',').map(s => s.trim().toLowerCase()) : [];
        const studentSkills = app.student_skills ? app.student_skills.split(',').map(s => s.trim().toLowerCase()) : [];

        const skillsHtml = requiredSkills.map(skill => {
            const isMatch = studentSkills.includes(skill);
            return `<span class="${isMatch ? 'skill-match' : 'skill-miss'}">${skill} ${isMatch ? '✓' : '✗'}</span>`;
        }).join(', ');

        document.getElementById('modal-content').innerHTML = `
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div><p class="text-sm text-muted">Student</p><p class="font-bold">${app.student_name}</p></div>
                <div><p class="text-sm text-muted">Roll No</p><p class="font-bold">${app.roll_number}</p></div>
                <div><p class="text-sm text-muted">Company</p><p class="font-bold">${app.company_name}</p></div>
                <div><p class="text-sm text-muted">Role</p><p class="font-bold">${app.job_role}</p></div>
            </div>
            
            <div class="mb-4">
                <h4 class="mb-2">Skills Match</h4>
                <div class="p-3 bg-gray-50 rounded border">${skillsHtml || 'No specific skills required'}</div>
            </div>

            <div class="mb-4">
                <h4 class="mb-2">Links</h4>
                <div class="flex gap-4">
                    ${app.resume_url ? `<a href="${app.resume_url}" target="_blank" class="text-primary">Resume</a>` : '<span class="text-muted">No Resume</span>'}
                    ${app.linkedin_url ? `<a href="${app.linkedin_url}" target="_blank" class="text-primary">LinkedIn</a>` : ''}
                </div>
            </div>

            <div class="mb-4">
                <h4 class="mb-2">Current Status</h4>
                <span class="badge badge-${getStatusColor(app.status)} text-lg">${app.status}</span>
            </div>
        `;

        // Dynamic Actions based on status workflow
        const actionsDiv = document.getElementById('modal-actions');
        let buttons = '';

        if (app.status === 'Applied') {
            buttons += `<button onclick="updateStatus(${app.id}, 'Shortlisted')" class="btn btn-primary">Shortlist</button>`;
            buttons += `<button onclick="updateStatus(${app.id}, 'Rejected')" class="btn btn-outline text-danger" style="border-color: var(--danger); color: var(--danger);">Reject</button>`;
        } else if (app.status === 'Shortlisted') {
            buttons += `<button onclick="updateStatus(${app.id}, 'Selected')" class="btn btn-success">Select</button>`;
            buttons += `<button onclick="updateStatus(${app.id}, 'Rejected')" class="btn btn-outline text-danger" style="border-color: var(--danger); color: var(--danger);">Reject</button>`;
        }

        actionsDiv.innerHTML = buttons;
        document.getElementById('app-modal').style.display = 'flex';
    };

    window.closeAppModal = () => { document.getElementById('app-modal').style.display = 'none'; };

    window.updateStatus = async (id, status) => {
        if (!confirm(`Change status to ${status}?`)) return;
        try {
            await API.put(`/admin/applications/${id}/status`, { status });
            Auth.showToast(`Status updated to ${status}`, 'success');
            closeAppModal();
            // Refresh
            const res = await API.get('/admin/applications');
            allApps = res.data;
            renderApplications(allApps);
        } catch (err) {
            Auth.showToast(err.message, 'error');
        }
    };

    window.bulkUpdate = async (status) => {
        const selected = Array.from(document.querySelectorAll('.app-checkbox:checked')).map(cb => cb.value);
        if (selected.length === 0) return;

        if (!confirm(`Update ${selected.length} applications to ${status}?`)) return;

        try {
            await Promise.all(selected.map(id => API.put(`/admin/applications/${id}/status`, { status })));
            Auth.showToast('Bulk update successful', 'success');
            // Refresh
            const res = await API.get('/admin/applications');
            allApps = res.data;
            renderApplications(allApps);
            document.getElementById('select-all').checked = false;
            updateBulkToolbar();
        } catch (err) {
            Auth.showToast('Some updates failed', 'error');
        }
    };

    window.exportApplications = () => {
        const header = ['Student', 'Roll No', 'Branch', 'CGPA', 'Company', 'Role', 'Status', 'Applied Date'];
        const rows = allApps.map(a => [
            a.student_name, a.roll_number, a.branch, a.cgpa,
            a.company_name, a.job_role, a.status, new Date(a.applied_at).toLocaleDateString()
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "applications_report.csv");
        document.body.appendChild(link);
        link.click();
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
