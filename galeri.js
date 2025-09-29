const token = localStorage.getItem("token");
let debounceTimeout;

// Build a public URL for a backend-returned file path. Handles full URLs and relative paths.
function buildPublicUrl(filePath) {
	if (!filePath) return null;
	if (/^https?:\/\//i.test(filePath)) return filePath;
	try {
		const apiBase = (typeof API_BASE !== 'undefined' && API_BASE) ? API_BASE : (location.origin + '/smkti/gallery-app/backend/api');
		const projectRoot = apiBase.replace(/\/backend\/api\/?$/, '');
		return projectRoot.replace(/\/+$/, '') + '/' + filePath.replace(/^\/+/, '');
	} catch (e) {
		return location.origin + '/' + filePath.replace(/^\/+/, '');
	}
}

document.addEventListener("DOMContentLoaded", () => {
	if (!token) {
		localStorage.clear()
		window.location.href = "index.html"; // Redirect ke halaman login jika tidak ada token
		return;
	}

	// Fungsi debounce
	function debounce(func, delay) {
		return function (...args) {
			clearTimeout(debounceTimeout);
			debounceTimeout = setTimeout(() => {
				func.apply(this, args);
			}, delay);
		};
	}

	// Event listener untuk input filter dengan debounce
	document.getElementById("filter_q").addEventListener("input", debounce((event) => {
		const query = event.target.value;
		getGaleri(query); // Panggil fungsi untuk mengambil data galeri dengan filter
	}, 700)); // Delay 300 ms

	// Wire Refresh button if present
	const btnRefresh = document.getElementById('btn-refresh');
	if (btnRefresh) btnRefresh.addEventListener('click', () => getGaleri());

	getGaleri(); // Panggil fungsi untuk mengambil data galeri saat halaman dimuat
});

// Fungsi untuk mengambil data galeri
async function getGaleri(query = "") {

	// Tampilkan modal preloading
	const preloadingModal = document.getElementById("preloading-modal");
	preloadingModal.style.display = "block";

	try {
	let path = '/galleries';
		if (query) path += `?filter_q=${encodeURIComponent(query)}`;
		const response = await apiFetch(path, { method: 'GET' });

		if (!response.ok) {
			const errorData = await response.json();

			// jika token telah kadalwarsa
			if (response.status === 401) {
				localStorage.clear()
				alert(errorData.message)
				window.location.href = "index.html";
			}
			throw new Error("Gagal memuat data galeri");
		}

		const result = await response.json();
		const galeri = Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []);

		if (!galeri || galeri.length === 0) {
			console.info('getGaleri: backend returned no items or unexpected shape', result);
		}

		const galeriContainer = document.querySelector(".galeri-container");
		galeriContainer.innerHTML = ""; // Kosongkan kontainer galeri sebelum mengisi

		galeri.forEach((item, index) => {
			const galeriItem = document.createElement('div');
			galeriItem.className = 'galeri-item';
			// determine title/description fields
			const title = item.title || item.nama || '';
			const desc = item.deskripsi || item.deskripsi || '';

			// Prefer explicit full URL fields from backend, then fall back to other possible fields
			const rawFile = item.file_url || item.fileUrl || item.image_url || item.image || item.file || item.path || item.filename || '';
			const imgSrc = buildPublicUrl(rawFile) || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='; // 1x1 transparent

			// escape single quotes in imgSrc for inline handler
			const escapedImgSrc = String(imgSrc).replace(/'/g, "\\'");

	    galeriItem.innerHTML = `
					<img src="${imgSrc}" alt="${title}">
					<p class="galeri-title">${title}</p>
					<p class="galeri-desc">${desc}</p>
					<button onclick="editNama(${item.id})">Edit Nama</button>
					<button onclick="showEditImageModal(${item.id}, '${escapedImgSrc}')">Edit Gambar</button>
					<button class="btn-danger" onclick="deleteGaleri(${item.id})">Hapus</button>
		    <div class="image-url" style="margin-top:6px;font-size:12px;color:#555">URL: <a href="${imgSrc}" target="_blank" rel="noreferrer">${imgSrc}</a></div>
			`;
			galeriContainer.appendChild(galeriItem);

			// Attach an error handler to try an alternate path if the primary URL fails.
			try {
				const imgEl = galeriItem.querySelector('img');
				if (imgEl) {
					imgEl.addEventListener('error', function onImgError() {
						// Prevent infinite loop
						if (imgEl.dataset._triedBackend) return;
						imgEl.dataset._triedBackend = '1';

						// If rawFile exists, try with a '/backend/' prefix
						if (rawFile) {
							const alt = buildPublicUrl('backend/' + rawFile.replace(/^\/+/, ''));
							console.info('Image load failed, retrying with backend path:', alt);
							imgEl.src = alt;
						}
					});
				}
			} catch (e) {
				console.warn('Failed to attach image error handler', e);
			}
		});
	} catch (error) {
		console.error("Error:", error);
	} finally {
		// Sembunyikan modal preloading
		preloadingModal.style.display = "none";
	}
}

// Fungsi untuk menghapus galeri
async function deleteGaleri(id) {
	const confirmed = confirm("Apakah Anda yakin ingin menghapus galeri ini?");
	if (!confirmed) {
		return; // Jika pengguna membatalkan, hentikan eksekusi fungsi
	}

	// Tampilkan modal preloading
	const preloadingModal = document.getElementById("preloading-modal");
	preloadingModal.style.display = "block";

	try {
	const response = await apiFetch(`/galleries/${id}`, { method: 'DELETE' });

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

		getGaleri(); // Refresh data galeri setelah penghapusan
	} catch (error) {
		console.error("Error:", error);
		alert(error.message);
	} finally {
		// Sembunyikan modal preloading
		preloadingModal.style.display = "none";
	}
}

// Fungsi untuk mengedit nama galeri
async function editNama(id) {
	const newName = prompt(`Masukkan nama baru: id ${id}`);
	if (!newName) {
		return; // Jika pengguna membatalkan, hentikan eksekusi fungsi
	}

	// Tampilkan modal preloading
	const preloadingModal = document.getElementById("preloading-modal");
	preloadingModal.style.display = "block";

	try {
	const response = await apiFetch(`/galleries/${id}`, { method: 'PUT', body: JSON.stringify({ title: newName }) });

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

		getGaleri(); // Refresh data galeri setelah pengubahan
	} catch (error) {
		console.error("Error:", error);
		alert(error.message);
	} finally {
		// Sembunyikan modal preloading
		preloadingModal.style.display = "none";
	}
}

// Fungsi untuk menampilkan modal edit gambar
function showEditImageModal(id, currentImageUrl) {
	const modal = document.getElementById("edit-image-modal");
	const currentImage = document.getElementById("current-image");
	const newImageFileInput = document.getElementById("new-image-file");
	const submitButton = document.getElementById("submit-new-image");

	currentImage.src = currentImageUrl;
	newImageFileInput.value = "";
	modal.style.display = "block";

	submitButton.onclick = function () {
		const newImageFile = newImageFileInput.files[0];
		if (newImageFile && newImageFile.type.startsWith("image/")) {
			editImage(id, newImageFile);
			modal.style.display = "none";
		} else {
			alert("Silakan pilih file gambar yang valid.");
		}
	};

	document.getElementById("cancel-edit-image").onclick = function () {
		modal.style.display = "none";
	};
}

// Fungsi untuk mengedit gambar galeri
async function editImage(id, newImageFile) {
	try {
		const formData = new FormData();
		formData.append("image", newImageFile);

		// apiFetch doesn't automatically set Content-Type for FormData; pass headers manually without Content-Type
	const url = `${API_BASE}/galleries/${id}/image`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`
			},
			body: formData
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

		getGaleri(); // Refresh data galeri setelah pengubahan
	} catch (error) {
		console.error("Error:", error);
		alert(error.message);
	}
}