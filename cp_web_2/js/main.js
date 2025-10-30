        // Data storage
        let users = JSON.parse(localStorage.getItem('coupleDiaryUsers')) || [];
        let entries = JSON.parse(localStorage.getItem('coupleDiaryEntries')) || [];
        let currentUser = null;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            checkLogin();
            setupEventListeners();
        });

        function setupEventListeners() {
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('registerForm').addEventListener('submit', handleRegister);
            document.getElementById('addEntryForm').addEventListener('submit', handleAddEntry);
            document.getElementById('showRegister').addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById('loginPage').classList.add('hidden');
                document.getElementById('registerPage').classList.remove('hidden');
            });
            document.getElementById('showLogin').addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById('registerPage').classList.add('hidden');
                document.getElementById('loginPage').classList.remove('hidden');
            });
            document.getElementById('entryImage').addEventListener('change', previewImage);
        }

        function handleLogin(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                currentUser = user;
                localStorage.setItem('currentCoupleDiaryUser', JSON.stringify(user));
                showMainApp();
            } else {
                alert('Username atau password salah!');
            }
        }

        function handleRegister(e) {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            const coupleCode = document.getElementById('coupleCode').value || generateCoupleCode();

            if (users.find(u => u.username === username)) {
                alert('Username sudah digunakan!');
                return;
            }

            const newUser = {
                id: Date.now(),
                name: name,
                username: username,
                password: password,
                coupleCode: coupleCode
            };

            users.push(newUser);
            localStorage.setItem('coupleDiaryUsers', JSON.stringify(users));
            
            alert(`Pendaftaran berhasil! Kode pasangan Anda: ${coupleCode}\nBagikan kode ini ke pasangan Anda untuk berbagi diary yang sama.`);
            
            document.getElementById('registerForm').reset();
            document.getElementById('registerPage').classList.add('hidden');
            document.getElementById('loginPage').classList.remove('hidden');
        }

        function generateCoupleCode() {
            return 'LOVE' + Math.random().toString(36).substr(2, 6).toUpperCase();
        }

        function checkLogin() {
            const savedUser = localStorage.getItem('currentCoupleDiaryUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                showMainApp();
            }
        }

        function showMainApp() {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('registerPage').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            document.getElementById('currentUserName').textContent = currentUser.name;
            document.getElementById('displayCoupleCode').textContent = currentUser.coupleCode;
            loadEntries();
        }

        function logout() {
            localStorage.removeItem('currentCoupleDiaryUser');
            currentUser = null;
            document.getElementById('mainApp').classList.add('hidden');
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('loginForm').reset();
        }

        function previewImage(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('imagePreview');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        }

        function handleAddEntry(e) {
            e.preventDefault();
            const text = document.getElementById('entryText').value;
            const imageFile = document.getElementById('entryImage').files[0];

            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    saveEntry(text, e.target.result);
                };
                reader.readAsDataURL(imageFile);
            } else {
                saveEntry(text, null);
            }
        }

        function saveEntry(text, imageData) {
            const newEntry = {
                id: Date.now(),
                coupleCode: currentUser.coupleCode,
                author: currentUser.name,
                authorId: currentUser.id,
                text: text,
                image: imageData,
                date: new Date().toISOString()
            };

            entries.push(newEntry);
            localStorage.setItem('coupleDiaryEntries', JSON.stringify(entries));
            
            document.getElementById('addEntryForm').reset();
            document.getElementById('imagePreview').style.display = 'none';
            
            loadEntries();
            
            // Scroll ke entry terbaru di atas
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
            
            alert('Kenangan berhasil disimpan! 💕');
        }

        function loadEntries() {
            const timeline = document.getElementById('timeline');
            const userEntries = entries.filter(e => e.coupleCode === currentUser.coupleCode);

            if (userEntries.length === 0) {
                timeline.innerHTML = `
                    <div class="empty-state">
                        <h3>Belum ada kenangan tersimpan</h3>
                        <p>Mulai tulis cerita cinta kalian! 💑</p>
                    </div>
                `;
                return;
            }

            // Urutkan dari yang terbaru (reverse order)
            userEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

            timeline.innerHTML = userEntries.map(entry => `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-date">${formatDate(entry.date)}</div>
                        <div class="timeline-author">Ditulis oleh ${entry.author}</div>
                        ${entry.image ? `<img src="${entry.image}" class="timeline-image" alt="Memory">` : ''}
                        <div class="timeline-text" id="text-${entry.id}">${entry.text}</div>
                        <textarea class="edit-textarea hidden" id="edit-${entry.id}">${entry.text}</textarea>
                        ${entry.authorId === currentUser.id ? `
                            <div class="timeline-actions">
                                <button class="btn-edit" onclick="editEntry(${entry.id})">Edit</button>
                                <button class="btn-delete" onclick="deleteEntry(${entry.id})">Hapus</button>
                                <button class="btn-save hidden" onclick="saveEdit(${entry.id})">Simpan</button>
                                <button class="btn-cancel hidden" onclick="cancelEdit(${entry.id})">Batal</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('id-ID', options);
        }

        function editEntry(id) {
            document.getElementById(`text-${id}`).classList.add('hidden');
            document.getElementById(`edit-${id}`).classList.remove('hidden');
            
            const actions = document.getElementById(`text-${id}`).nextElementSibling.nextElementSibling;
            actions.querySelector('.btn-edit').classList.add('hidden');
            actions.querySelector('.btn-delete').classList.add('hidden');
            actions.querySelector('.btn-save').classList.remove('hidden');
            actions.querySelector('.btn-cancel').classList.remove('hidden');
        }

        function cancelEdit(id) {
            document.getElementById(`text-${id}`).classList.remove('hidden');
            document.getElementById(`edit-${id}`).classList.add('hidden');
            
            const actions = document.getElementById(`text-${id}`).nextElementSibling.nextElementSibling;
            actions.querySelector('.btn-edit').classList.remove('hidden');
            actions.querySelector('.btn-delete').classList.remove('hidden');
            actions.querySelector('.btn-save').classList.add('hidden');
            actions.querySelector('.btn-cancel').classList.add('hidden');
        }

        function saveEdit(id) {
            const newText = document.getElementById(`edit-${id}`).value;
            const entryIndex = entries.findIndex(e => e.id === id);
            
            if (entryIndex !== -1) {
                entries[entryIndex].text = newText;
                localStorage.setItem('coupleDiaryEntries', JSON.stringify(entries));
                loadEntries();
                alert('Kenangan berhasil diupdate! ✨');
            }
        }

        function deleteEntry(id) {
            if (confirm('Yakin ingin menghapus kenangan ini? 💔')) {
                entries = entries.filter(e => e.id !== id);
                localStorage.setItem('coupleDiaryEntries', JSON.stringify(entries));
                loadEntries();
                alert('Kenangan telah dihapus.');
            }
        }