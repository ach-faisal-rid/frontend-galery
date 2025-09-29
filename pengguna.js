// Add JS here
document.addEventListener("DOMContentLoaded", () => {
	console.log("Page Pengguna")
	getUsers()
});
const token = localStorage.getItem("token");
let isLoading = false;

document.getElementById("btn-refresh").addEventListener("click", (e) => {
	// Cek apakah sedang memuat data
	if (isLoading === false) {
		getUsers();
	}
})

async function editUser(users_id) {
	window.location = `pengguna-edit.html?users_id=${users_id}`
}

async function deleteUser(users_id) {
	const confirmed = confirm("Apakah Anda yakin ingin menghapus pengguna ini?");
	if (!confirmed) {
		return; // Jika pengguna membatalkan, hentikan eksekusi fungsi
	}

	// Tampilkan modal preloading
	const preloadingModal = document.getElementById("preloading-modal");
	preloadingModal.style.display = "block";

	try {

			const response = await apiFetch(`/users${users_id}`, {
				method: 'DELETE'
			});

			// Search by ID handlers
			const btnSearch = document.getElementById('btn-search-id');
			const btnClearSearch = document.getElementById('btn-clear-search');
			const searchInput = document.getElementById('search-id');
			const searchMessage = document.getElementById('search-message');

			if (btnSearch) btnSearch.addEventListener('click', async () => {
				const id = searchInput.value && searchInput.value.trim();
				if (!id) {
					searchMessage.innerText = 'Masukkan ID valid';
					return;
				}
				searchMessage.innerText = '';
				await getUserById(id);
			});

			if (btnClearSearch) btnClearSearch.addEventListener('click', () => {
				searchInput.value = '';
				searchMessage.innerText = '';
				getUsers();
			});

		if (!response.ok) {
			const errorData = await response.json();

			// jika token telah kadalwarsa
			if (response.status === 401) {
				localStorage.clear()
				alert(errorData.message)
				window.location.href = "index.html";
			}

			throw new Error(errorData.message);
		}

		window.location = "pengguna.html"
	} catch (error) {
		console.error("Error:", error);
		alert(error.message);
	} finally {
		// Sembunyikan modal preloading
		preloadingModal.style.display = 'none';
	}
}

async function getUsers() {
	try {
		isLoading = true; // Set flag menjadi true saat mulai memuat data

		const tbody = document.querySelector("#pengguna .table tbody");
		tbody.innerHTML = ""; // Kosongkan tabel sebelum mengisi

		const tr = document.createElement("tr");
		tr.innerHTML = `<td colspan="6">Sedang mengambil data...</td>`;
		tbody.appendChild(tr);
		const response = await apiFetch('/users', { method: 'GET' });

		if (!response.ok) {
			isLoading = false;
			const errorData = await response.json();

			// jika token telah kadalwarsa
			if (response.status === 401) {
				localStorage.clear()
				alert(errorData.message)
				window.location.href = "index.html";
			}

			tbody.innerHTML = "";
			tr.innerHTML = `<td colspan="6">${errorData.message}</td>`;
			tbody.appendChild(tr);
			throw new Error("Gagal memuat data pengguna");
		}

		const result = await response.json();
		const users = result.data;
		isLoading = false;

		if (users.length === 0) {
			tbody.innerHTML = "";
			tr.innerHTML = `<td colspan="6">Data Kosong</td>`;
			tbody.appendChild(tr);
		}

		tbody.innerHTML = ""; // Kosongkan tabel sebelum mengisi

		users.forEach((user, index) => {
			const tr = document.createElement("tr");
			tr.innerHTML = `
					<td>${index + 1}</td>
					<td>${user.nama}</td>
					<td>${user.no_telpon}</td>
					<td>${user.email}</td>
					<td>${user.level}</td>
					<td><button class="btn btn-small" onclick="editUser(${user.id})">Edit</button> <button class="btn btn-small btn-danger" onclick="deleteUser(${user.id})">Delete</button></td>
			`;
			tbody.appendChild(tr);
		});
	} catch (error) {
		console.error("Error:", error);
	}
}

// Ambil user berdasarkan ID dan tampilkan menjadi satu baris di tabel
async function getUserById(id) {
	const tbody = document.querySelector('#pengguna .table tbody');
	tbody.innerHTML = '';
	const tr = document.createElement('tr');
	tr.innerHTML = `<td colspan="6">Sedang mengambil data...</td>`;
	tbody.appendChild(tr);

	try {
		const response = await apiFetch(`/users/${encodeURIComponent(id)}`, { method: 'GET' });
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			tbody.innerHTML = '';
			tr.innerHTML = `<td colspan="6">${errorData.message || 'User tidak ditemukan'}</td>`;
			tbody.appendChild(tr);
			return;
		}

		const result = await response.json();
		const user = result.data || result; // depending on API shape

		tbody.innerHTML = '';
		if (!user) {
			tr.innerHTML = `<td colspan="6">User tidak ditemukan</td>`;
			tbody.appendChild(tr);
			return;
		}

		const row = document.createElement('tr');
		row.innerHTML = `
			<td>1</td>
			<td>${user.nama || user.name || ''}</td>
			<td>${user.no_telpon || user.phone || ''}</td>
			<td>${user.email || ''}</td>
			<td>${user.level || ''}</td>
			<td><button class="btn btn-small" onclick="editUser(${user.id})">Edit</button> <button class="btn btn-small btn-danger" onclick="deleteUser(${user.id})">Delete</button></td>
		`;
		tbody.appendChild(row);
	} catch (err) {
		tbody.innerHTML = '';
		tr.innerHTML = `<td colspan="6">Terjadi kesalahan koneksi</td>`;
		tbody.appendChild(tr);
		console.error(err);
	}
}
