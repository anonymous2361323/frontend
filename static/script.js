const API_BASE_URL = 'https://back-thbr.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    let currentUsesLeft = 3;
    let isLoggedIn = false;
    let isPaid = false;

    // Utility Functions
    function updateUI() {
        const counter = document.getElementById('uses-counter');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const remixBtn = document.getElementById('remix-btn');
        
        if (isLoggedIn) {
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            if (isPaid) {
                counter.textContent = 'Unlimited remixes! ✨';
                counter.className = 'font-semibold bg-green-500/20 backdrop-blur-sm rounded-full px-6 py-2';
            } else {
                counter.textContent = `${currentUsesLeft} free remixes left`;
                counter.className = 'font-semibold bg-white/20 backdrop-blur-sm rounded-full px-6 py-2';
            }
            remixBtn.disabled = false;
            remixBtn.textContent = '✨ Remix It Now';
        } else {
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            counter.textContent = '3 free remixes available';
            counter.className = 'font-semibold bg-white/20 backdrop-blur-sm rounded-full px-6 py-2';
            remixBtn.disabled = true;
            remixBtn.textContent = '🔐 Log in to remix!';
        }
    }

    function showError(message) {
        const output = document.getElementById('output-text');
        output.textContent = `❌ Error: ${message}`;
        document.getElementById('copy-btn').classList.add('hidden');
    }

    // Session Check
    async function checkSession() {
        try {
            const response = await fetch(`${API_BASE_URL}/check_session`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            isLoggedIn = data.logged_in;
            isPaid = data.is_paid || false;
            if (data.uses_left !== undefined) {
                currentUsesLeft = data.uses_left;
            }
            updateUI();
        } catch (error) {
            console.error('Session check failed:', error);
            updateUI();
        }
    }

    // Remix Button
    document.getElementById('remix-btn').addEventListener('click', async () => {
        const remixBtn = document.getElementById('remix-btn');
        const inputText = document.getElementById('input-text').value.trim();
        const remixType = document.getElementById('remix-type').value;
        
        if (!inputText) {
            showError('Please enter some text to remix!');
            return;
        }

        remixBtn.disabled = true;
        remixBtn.innerHTML = '⏳ Remixing... (up to 2 min)';
        document.getElementById('output-text').textContent = '🤖 AI is working its magic...';

        try {
            const response = await fetch(`${API_BASE_URL}/remix`, {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: inputText, 
                    'remix-type': remixType 
                })
            });

            const data = await response.json();

            if (response.ok && data.output) {
                document.getElementById('output-text').textContent = data.output;
                document.getElementById('copy-btn').classList.remove('hidden');
                if (data.uses_left !== undefined && data.uses_left !== 'unlimited') {
                    currentUsesLeft = data.uses_left;
                    if (!isPaid && currentUsesLeft <= 0) {
                        document.getElementById('paywall').classList.remove('hidden');
                    }
                }
                checkSession();
            } else {
                if (data.error && data.error.includes('No free remixes')) {
                    document.getElementById('paywall').classList.remove('hidden');
                } else {
                    showError(data.error || 'Something went wrong!');
                }
            }
        } catch (error) {
            showError('Connection error. Please try again.');
            console.error('Remix error:', error);
        } finally {
            remixBtn.disabled = false;
            remixBtn.innerHTML = '✨ Remix It Now';
        }
    });

    // Copy Button
    document.getElementById('copy-btn').addEventListener('click', async () => {
        const text = document.getElementById('output-text').textContent;
        try {
            await navigator.clipboard.writeText(text);
            const btn = document.getElementById('copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            btn.style.backgroundColor = '#10b981';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
            }, 2000);
        } catch (err) {
            alert('Failed to copy. Please select and copy manually.');
        }
    });

    // Login Modal
    document.getElementById('login-btn').addEventListener('click', () => {
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('login-error').classList.add('hidden');
    });

    document.getElementById('close-login-btn').addEventListener('click', () => {
        document.getElementById('login-modal').classList.add('hidden');
    });

    // Login Form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const hcaptchaResponse = document.querySelector('textarea[name="h-captcha-response"]')?.value;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                credentials: 'include',
                body: new URLSearchParams({
                    ...Object.fromEntries(formData),
                    'h-captcha-response': hcaptchaResponse
                })
            });

            const data = await response.json();

            if (response.ok) {
                isLoggedIn = true;
                isPaid = data.is_paid;
                currentUsesLeft = data.uses_left;
                document.getElementById('login-modal').classList.add('hidden');
                updateUI();
                alert('Login successful! 🎉');
            } else {
                document.getElementById('login-error').textContent = data.error;
                document.getElementById('login-error').classList.remove('hidden');
            }
        } catch (error) {
            document.getElementById('login-error').textContent = 'Login failed. Please try again.';
            document.getElementById('login-error').classList.remove('hidden');
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'GET',
                credentials: 'include'
            });
            isLoggedIn = false;
            isPaid = false;
            currentUsesLeft = 3;
            updateUI();
            alert('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    // Contact Form
    document.getElementById('contact-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const status = document.getElementById('contact-status');

        try {
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                status.textContent = '✅ Message sent successfully!';
                status.className = 'text-center mt-4 text-green-400';
                e.target.reset();
            } else {
                status.textContent = `❌ ${data.error}`;
                status.className = 'text-center mt-4 text-red-400';
            }
        } catch (error) {
            status.textContent = '❌ Failed to send message.';
            status.className = 'text-center mt-4 text-red-400';
        }
        status.classList.remove('hidden');
    });

    // Paywall Modal
    document.getElementById('close-paywall-btn').addEventListener('click', () => {
        document.getElementById('paywall').classList.add('hidden');
    });

    // PayPal Button
    if (typeof paypal !== 'undefined') {
        paypal.Buttons({
            createSubscription: function(data, actions) {
                return actions.subscription.create({
                    plan_id: 'P-5LK680852J287884DNDUFRKA'
                });
            },
            onApprove: function(data, actions) {
                return fetch(`${API_BASE_URL}/update_subscription`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({subscriptionID: data.subscriptionID})
                }).then(() => {
                    document.getElementById('paywall').classList.add('hidden');
                    alert('Subscription activated! 🎉');
                    location.reload();
                });
            },
            onError: function(err) {
                alert('Payment error. Please try again.');
                console.error('PayPal error:', err);
            }
        }).render('#paypal-button-container');
    }

    // Initialize
    checkSession();
    document.getElementById('input-text').focus();
});