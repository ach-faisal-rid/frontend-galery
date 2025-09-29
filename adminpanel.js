// Add JS here
// Cek apakah token ada di localStorage saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
	const token = localStorage.getItem("token");
	if (!token) {
		// Redirect ke halaman dashboard jika token ditemukan
		window.location.href = "index.html";
	}

	getCurrentUsers()
});

const onLogout = document.getElementById("menu-logout");

onLogout.onclick = () => {
	localStorage.clear()
		window.location.href = "index.html";
}

async function getCurrentUsers() {
	const token = localStorage.getItem("token");

	try {
		// Use apiFetch helper, it will attach Authorization header automatically
		const response = await apiFetch('/current', {
			method: 'GET'
		});

		if (!response.ok) {
			const errorData = await response.json();
			if (response.status === 401) {
				localStorage.clear()
				alert(errorData.message)
				window.location.href = "index.html";
			}
			return;
		}

		const data = await response.json(); // Mengkonversi respon menjadi format JSON

		if (data.data) {
			localStorage.setItem("currentUsers", JSON.stringify(data.data));
			document.getElementById("usersName").innerText = data.data.nama;
			document.getElementById("usersLevel").innerText = data.data.level;
		}
	} catch (error) {
		console.error("Error:", error);
	}
}
