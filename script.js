var STORAGE_KEY = "contactHubContacts";
var contacts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
var editingId = null;
var selectedPhoto = "";
var modal = new bootstrap.Modal(document.getElementById("contactModal"));
var form = document.getElementById("contactForm");
var addContactBtn = document.getElementById("addContactBtn");
var photoInput = document.getElementById("photoInput");
var photoPreview = document.getElementById("photoPreview");
var searchInput = document.getElementById("searchInput");
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}
function getInitials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
}
function validPhone(phone) {
    return /^(?:01[0125]\d{8}|(?:\+20|0020)1[0125]\d{8})$/.test(phone.replace(/[\s-]/g, ""));
}
function validEmail(email) {
    return email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
function resetForm() {
    form.reset();
    form.classList.remove("was-validated");
    document.querySelectorAll(".is-invalid, .is-valid").forEach(element => {
        element.classList.remove("is-invalid", "is-valid");
    });
    selectedPhoto = "";
    editingId = null;
    document.getElementById("modalTitle").textContent = "Add New Contact";
    document.getElementById("saveContactBtn").innerHTML = '<i class="bi bi-check-lg"></i> Save Contact';
    photoPreview.innerHTML = '<i class="bi bi-person-fill"></i>';
}
function openAddModal() {
    resetForm();
    modal.show();
}
function fillForm(contact) {
    resetForm();
    editingId = contact.id;
    document.getElementById("modalTitle").textContent = "Edit Contact";
    document.getElementById("saveContactBtn").innerHTML = '<i class="bi bi-check-lg"></i> Update Contact';
    document.getElementById("nameInput").value = contact.name;
    document.getElementById("phoneInput").value = contact.phone;
    document.getElementById("emailInput").value = contact.email;
    document.getElementById("addressInput").value = contact.address;
    document.getElementById("groupInput").value = contact.group;
    document.getElementById("notesInput").value = contact.notes;
    document.getElementById("favoriteInput").checked = contact.favorite;
    document.getElementById("emergencyInput").checked = contact.emergency;
    selectedPhoto = contact.photo || "";
    photoPreview.innerHTML = selectedPhoto ? `<img src="${selectedPhoto}" alt="Contact photo">` : '<i class="bi bi-person-fill"></i>';
    modal.show();
}
function getFormData() {
    return {
        name: document.getElementById("nameInput").value.trim(),
        phone: document.getElementById("phoneInput").value.trim(),
        email: document.getElementById("emailInput").value.trim(),
        address: document.getElementById("addressInput").value.trim(),
        group: document.getElementById("groupInput").value,
        notes: document.getElementById("notesInput").value.trim(),
        favorite: document.getElementById("favoriteInput").checked,
        emergency: document.getElementById("emergencyInput").checked,
        photo: selectedPhoto
    };
}
function validateForm() {
    var name = document.getElementById("nameInput");
    var phone = document.getElementById("phoneInput");
    var email = document.getElementById("emailInput");
    var valid = true;
    [name, phone, email].forEach(element => {
        element.classList.remove("is-invalid", "is-valid");
    });
    if (name.value.trim().length < 2) {
        name.classList.add("is-invalid");
        valid = false;
    } else {
        name.classList.add("is-valid");
    }
    if (!validPhone(phone.value.trim())) {
        phone.classList.add("is-invalid");
        valid = false;
    } else {
        phone.classList.add("is-valid");
    }
    if (!validEmail(email.value.trim())) {
        email.classList.add("is-invalid");
        valid = false;
    } else if (email.value.trim()) {
        email.classList.add("is-valid");
    }
    return valid;
}
form.addEventListener("submit", event => {
    event.preventDefault();
    if (!validateForm()) {
        return;
    }
    var data = getFormData();
    if (editingId) {
        var index = contacts.findIndex(contact => contact.id === editingId);
        if (index !== -1) {
            contacts[index] = {
                ...contacts[index],
                ...data
            };
        }
    } else {
        contacts.unshift({
            id: Date.now().toString(),
            ...data
        });
    }
    saveToStorage();
    render();
    modal.hide();
    resetForm();
});
addContactBtn.addEventListener("click", openAddModal);
photoInput.addEventListener("change", event => {
    var file = event.target.files[0];
    if (!file) {
        return;
    }
    if (!file.type.startsWith("image/")) {
        return;
    }
    var reader = new FileReader();
    reader.onload = () => {
        selectedPhoto = reader.result;
        photoPreview.innerHTML = `<img src="${selectedPhoto}" alt="Contact photo">`;
    };
    reader.readAsDataURL(file);
});
searchInput.addEventListener("input", render);
document.getElementById("contactsContainer").addEventListener("click", event => {
    var button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }
    var id = button.dataset.id;
    var action = button.dataset.action;
    var contact = contacts.find(item => item.id === id);
    if (!contact) {
        return;
    }
    if (action === "devare") {
        if (confirm(`Are you sure you want to delete ${contact.name}?`)) {
            contacts = contacts.filter(item => item.id !== id);
            saveToStorage();
            render();
        }
    }
    if (action === "edit") {
        fillForm(contact);
    }
    if (action === "favorite") {
        contact.favorite = !contact.favorite;
        saveToStorage();
        render();
    }
});
function render() {
    var query = searchInput.value.trim().toLowerCase();
    var filtered = contacts.filter(contact => [contact.name, contact.phone, contact.email].some(value => (value || "").toLowerCase().includes(query)));
    document.getElementById("totalCount").textContent = contacts.length;
    document.getElementById("favoriteCount").textContent = contacts.filter(contact => contact.favorite).length;
    document.getElementById("emergencyCount").textContent = contacts.filter(contact => contact.emergency).length;
    document.getElementById("contactNumberText").textContent = contacts.length;
    var container = document.getElementById("contactsContainer");
    var empty = document.getElementById("emptyState");
    container.innerHTML = filtered.map(createCard).join("");
    empty.style.display = filtered.length ? "none" : "block";
    document.getElementById("favoritesList").innerHTML = sideList(contacts.filter(contact => contact.favorite), "No favorites yet");
    document.getElementById("emergencyList").innerHTML = sideList(contacts.filter(contact => contact.emergency), "No emergency contacts");
}
function createCard(contact) {
    var photo = contact.photo ? `<img class="contact-photo" src="${contact.photo}" alt="${escapeHtml(contact.name)}">` : `<div class="contact-photo">${escapeHtml(getInitials(contact.name))}</div>`;
    return `
        <article class="contact-card" id="contact-${contact.id}">
            <div class="contact-main">
                <div class="contact-top">
                    ${photo}
                    <div class="flex-grow-1 min-w-0">
                        <h3 class="contact-name text-truncate">${escapeHtml(contact.name)}</h3>
                        ${contact.group ? `<span class="contact-group">${escapeHtml(contact.group)}</span>` : ""}
                        <div class="contact-badges">
                            ${contact.favorite ? `<span class="badge-soft badge-fav"><i class="bi bi-star-fill"></i> Favorite</span>` : ""}
                            ${contact.emergency ? `<span class="badge-soft badge-emergency"><i class="bi bi-heart-pulse-fill"></i> Emergency</span>` : ""}
                        </div>
                    </div>
                </div>
                <div class="contact-info">
                    ${contact.phone ? `<div class="info-row"><i class="bi bi-telephone-fill"></i><span>${escapeHtml(contact.phone)}</span></div>` : ""}
                    ${contact.email ? `<div class="info-row"><i class="bi bi-envelope-fill"></i><span>${escapeHtml(contact.email)}</span></div>` : ""}
                    ${contact.address ? `<div class="info-row"><i class="bi bi-geo-alt-fill"></i><span>${escapeHtml(contact.address)}</span></div>` : ""}
                </div>
            </div>
            <div class="contact-actions">
                <div class="left-actions">
                    ${contact.phone ? `<a class="action-btn call-btn" href="tel:${escapeHtml(contact.phone)}" aria-label="Call"><i class="bi bi-telephone-fill"></i></a>` : ""}
                    ${contact.email ? `<a class="action-btn mail-btn" href="mailto:${escapeHtml(contact.email)}" aria-label="Email"><i class="bi bi-envelope-fill"></i></a>` : ""}
                </div>
                <div class="right-actions">
                    <button class="action-btn ${contact.favorite ? "star-active" : ""}" data-action="favorite" data-id="${contact.id}" aria-label="Favorite">
                        <i class="bi ${contact.favorite ? "bi-star-fill" : "bi-star"}"></i>
                    </button>
                    <button class="action-btn edit-btn" data-action="edit" data-id="${contact.id}" aria-label="Edit">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="action-btn devare-btn" data-action="devare" data-id="${contact.id}" aria-label="Devare">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </div>
            </div>
        </article>
    `;
}
function sideList(list, emptyText) {
    if (!list.length) {
        return `
            <div class="side-empty">
                ${emptyText}
            </div>
        `;
    }
    return list.slice(0, 5).map(contact => `
        <a href="#contact-${contact.id}" class="side-contact">
            <div class="side-mini-avatar">
                ${contact.photo ? `<img src="${contact.photo}" alt="">` : escapeHtml(getInitials(contact.name))}
            </div>
            <div>
                <strong>${escapeHtml(contact.name)}</strong>
                <span>${escapeHtml(contact.phone)}</span>
            </div>
        </a>
    `).join("");
}
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}
render();