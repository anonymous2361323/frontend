const API_BASE_URL = 'https://back-thbr.onrender.com';

// ==================== AD REWARD SYSTEM ====================
const AD_REWARD_SYSTEM = {
    adsWatchedKey: 'ads_watched_today',
    adsWatchedDateKey: 'ads_watched_date',
    requiredAds: 5,
    premiumExpiryKey: 'ad_premium_expiry',
    
    getAdsWatchedToday() {
        const today = new Date().toDateString();
        const lastDate = localStorage.getItem(this.adsWatchedDateKey);
        
        // Reset counter if it's a new day
        if (lastDate !== today) {
            localStorage.setItem(this.adsWatchedDateKey, today);
            localStorage.setItem(this.adsWatchedKey, '0');
            return 0;
        }
        
        return parseInt(localStorage.getItem(this.adsWatchedKey) || '0');
    },
    
    incrementAdsWatched() {
        const current = this.getAdsWatchedToday();
        localStorage.setItem(this.adsWatchedKey, (current + 1).toString());
        return current + 1;
    },
    
    hasAdPremium() {
        const expiry = localStorage.getItem(this.premiumExpiryKey);
        if (!expiry) return false;
        return new Date(expiry) > new Date();
    },
    
    grantAdPremium() {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        localStorage.setItem(this.premiumExpiryKey, expiry.toISOString());
    },
    
    getTimeRemaining() {
        const expiry = localStorage.getItem(this.premiumExpiryKey);
        if (!expiry) return null;
        const remaining = new Date(expiry) - new Date();
        if (remaining <= 0) return null;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        return `${hours}h remaining`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    let currentUsesLeft = 3;
    let isLoggedIn = false;
    let isPaid = false;

    // Define premium options that require subscription
    const premiumOptions = [
        'email',      // Professional Email
        'ad',         // Ad Copy
        'blog',       // Blog Post
        'story',      // Story/Narrative
        'smalltalk',  // Small Talk Starter
        'salespitch', // Sales Pitch Opener
        'thanks',     // Casual Thank-You Speech
        'followup',   // Friendly Follow-Up
        'apology',    // Quick Apology
        'reminder',   // Urgent Reminder
        'agenda',     // Meeting Agenda Teaser
        'interview'   // Job Interview Pitch
    ];

    // ==================== GOOGLE ADSENSE FUNCTIONS ====================
    function initializeAdSense() {
        // AdSense auto ads initialization (if you're using auto ads)
        // The script tag is already in your HTML head section
        console.log('AdSense initialized');
    }

    function showAdModal() {
        const modal = document.getElementById('ad-modal');
        if (!modal) {
            createAdModal();
        }
        document.getElementById('ad-modal').classList.remove('hidden');
        
        // Load AdSense ad into the modal
        loadAdSenseAd();
    }

    function createAdModal() {
        const modalHTML = `
            <div id="ad-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 hidden">
                <div class="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl">📺</span>
                        </div>
                        <h2 class="text-3xl font-black mb-2 text-gray-800">Watch Ad for Premium</h2>
                        <p class="text-gray-600" id="ad-progress-text">Watch 5 ads to unlock 24 hours of Premium access!</p>
                    </div>
                    
                    <div id="ad-container" class="min-h-[250px] bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                        <!-- AdSense ad will load here -->
                        <p class="text-gray-500">Loading advertisement...</p>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="closeAdModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-xl transition-all">
                            Close
                        </button>
                        <button id="ad-complete-btn" onclick="onAdWatched()" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all" disabled>
                            Ad Watched ✓
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function loadAdSenseAd() {
        const container = document.getElementById('ad-container');
        
        // Your actual AdSense ad code
        container.innerHTML = `
            <ins class="adsbygoogle"
                 style="display:block; min-height:250px;"
                 data-ad-client="ca-pub-8389319752765958"
                 data-ad-slot="auto"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        `;
        
        // Push ad to AdSense
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
            container.innerHTML = '<p class="text-red-500">Ad failed to load. Please try again.</p>';
        }
        
        // Enable the "Ad Watched" button after 10 seconds
        setTimeout(() => {
            document.getElementById('ad-complete-btn').disabled = false;
        }, 10000);
    }

    window.closeAdModal = function() {
        document.getElementById('ad-modal').classList.add('hidden');
    }

    window.onAdWatched = function() {
        const adsWatched = AD_REWARD_SYSTEM.incrementAdsWatched();
        const remaining = AD_REWARD_SYSTEM.requiredAds - adsWatched;
        
        closeAdModal();
        
        if (remaining <= 0) {
            AD_REWARD_SYSTEM.grantAdPremium();
            alert('🎉 Congratulations! You earned 24 hours of Premium access!');
            updateAdButton();
            updateUI();
        } else {
            alert(`✅ Ad watched! Watch ${remaining} more ad${remaining > 1 ? 's' : ''} for 24hrs Premium`);
            updateAdButton();
        }
    }

    function updateAdButton() {
        let btn = document.getElementById('watch-ads-btn');
        if (!btn) {
            // Create the button if it doesn't exist
            const container = document.querySelector('.mt-4.flex.justify-center.items-center.flex-wrap.gap-2');
            if (container) {
                btn = document.createElement('button');
                btn.id = 'watch-ads-btn';
                btn.className = 'bg-blue-500 hover:bg-blue-600 backdrop-blur-sm rounded-full px-6 py-2 font-semibold transition-all';
                container.appendChild(btn);
                btn.addEventListener('click', showAdModal);
            } else {
                return;
            }
        }
        
        const adsWatched = AD_REWARD_SYSTEM.getAdsWatchedToday();
        const remaining = AD_REWARD_SYSTEM.requiredAds - adsWatched;
        
        if (AD_REWARD_SYSTEM.hasAdPremium()) {
            const timeLeft = AD_REWARD_SYSTEM.getTimeRemaining();
            btn.innerHTML = `✨ Ad Premium Active (${timeLeft})`;
            btn.classList.add('opacity-75', 'cursor-not-allowed', 'bg-green-500');
            btn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            btn.disabled = true;
        } else if (remaining <= 0) {
            btn.innerHTML = `📺 Watch More Ads Tomorrow`;
            btn.classList.add('opacity-75');
            btn.disabled = true;
        } else {
            btn.innerHTML = `📺 Watch ${remaining} Ad${remaining > 1 ? 's' : ''} for 24hr Premium`;
            btn.classList.remove('opacity-75', 'cursor-not-allowed', 'bg-green-500');
            btn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            btn.disabled = false;
        }
    }

    // ==================== UTILITY FUNCTIONS ====================
    function updateUI() {
        const counter = document.getElementById('uses-counter');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const remixBtn = document.getElementById('remix-btn');
        const upgradeBtn = document.getElementById('upgrade-btn');
        
        // Check if user has ad-earned premium
        const hasAdPremium = AD_REWARD_SYSTEM.hasAdPremium();
        const effectivelyPremium = isPaid || hasAdPremium;
        
        if (isLoggedIn) {
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            
            if (effectivelyPremium) {
                counter.textContent = hasAdPremium ? '✨ Ad Premium Active!' : 'Unlimited remixes! ✨';
                counter.className = 'font-semibold bg-green-500/20 backdrop-blur-sm rounded-full px-6 py-2';
                if (upgradeBtn) upgradeBtn.classList.add('hidden');
            } else {
                counter.textContent = `${currentUsesLeft} free remixes left`;
                counter.className = 'font-semibold bg-white/20 backdrop-blur-sm rounded-full px-6 py-2';
                if (upgradeBtn) upgradeBtn.classList.remove('hidden');
            }
            remixBtn.disabled = false;
            remixBtn.textContent = '✨ Remix It Now';
            
            // Show referral button when logged in
            addReferralButton();
            const referralBtn = document.getElementById('referral-btn');
            if (referralBtn) referralBtn.classList.remove('hidden');
        } else {
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            counter.textContent = '3 free remixes available';
            counter.className = 'font-semibold bg-white/20 backdrop-blur-sm rounded-full px-6 py-2';
            remixBtn.disabled = true;
            remixBtn.textContent = '🔐 Log in to remix!';
            if (upgradeBtn) upgradeBtn.classList.add('hidden');
            
            // Hide referral button when logged out
            const referralBtn = document.getElementById('referral-btn');
            if (referralBtn) referralBtn.classList.add('hidden');
        }
        
        updateAdButton();
    }

    function showError(message) {
        const output = document.getElementById('output-text');
        output.textContent = `❌ Error: ${message}`;
        document.getElementById('copy-btn').classList.add('hidden');
    }

    // Mark premium options in the dropdown
    function markPremiumOptions() {
        const selectElement = document.getElementById('remix-type');
        const options = selectElement.querySelectorAll('option');
        
        options.forEach(option => {
            if (premiumOptions.includes(option.value)) {
                if (!option.textContent.includes('🔒')) {
                    option.textContent = '🔒 ' + option.textContent + ' (Premium)';
                    option.classList.add('premium-option');
                }
            }
        });
    }

    // ==================== SESSION CHECK ====================
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

    // ==================== REMIX BUTTON ====================
    document.getElementById('remix-btn').addEventListener('click', async () => {
        const remixBtn = document.getElementById('remix-btn');
        const inputText = document.getElementById('input-text').value.trim();
        const remixType = document.getElementById('remix-type').value;
        
        if (!inputText) {
            showError('Please enter some text to remix!');
            return;
        }

        // Check if user has premium (either paid or ad-earned)
        const hasAdPremium = AD_REWARD_SYSTEM.hasAdPremium();
        const effectivelyPremium = isPaid || hasAdPremium;

        // Check if selected option is premium and user doesn't have premium access
        if (premiumOptions.includes(remixType) && !effectivelyPremium) {
            // Show option: watch ads OR upgrade
            if (confirm('This is a premium feature. Watch ads to unlock 24hrs of premium, or subscribe now?')) {
                document.getElementById('paywall').classList.remove('hidden');
            } else {
                showAdModal();
            }
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
                    if (!effectivelyPremium && currentUsesLeft <= 0) {
                        // Offer ad watching or subscription
                        if (confirm('No free remixes left! Watch ads for 24hrs premium or subscribe?')) {
                            document.getElementById('paywall').classList.remove('hidden');
                        } else {
                            showAdModal();
                        }
                    }
                }
                checkSession();
            } else {
                if (data.error && (data.error.includes('Premium') || data.error.includes('subscription'))) {
                    if (confirm('Premium feature required. Watch ads or subscribe?')) {
                        document.getElementById('paywall').classList.remove('hidden');
                    } else {
                        showAdModal();
                    }
                } else if (data.error && data.error.includes('No free remixes')) {
                    if (confirm('No free remixes left! Watch ads for 24hrs premium or subscribe?')) {
                        document.getElementById('paywall').classList.remove('hidden');
                    } else {
                        showAdModal();
                    }
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

    // ==================== COPY BUTTON ====================
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

    // ==================== LOGIN MODAL ====================
    document.getElementById('login-btn').addEventListener('click', () => {
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('login-error').classList.add('hidden');
    });

    document.getElementById('close-login-btn').addEventListener('click', () => {
        document.getElementById('login-modal').classList.add('hidden');
    });

    // ==================== LOGIN FORM ====================
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

    // ==================== LOGOUT ====================
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

    // ==================== UPGRADE BUTTON ====================
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            document.getElementById('paywall').classList.remove('hidden');
        });
    }

    // ==================== CONTACT FORM ====================
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

    // ==================== PAYWALL MODAL ====================
    document.getElementById('close-paywall-btn').addEventListener('click', () => {
        document.getElementById('paywall').classList.add('hidden');
    });

    // ==================== PAYPAL BUTTON ====================
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

    // ==================== REFERRAL SHARING ====================
    function createReferralModal() {
        const modalHTML = `
            <div id="referral-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 hidden">
                <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl">🎁</span>
                        </div>
                        <h2 class="text-3xl font-black mb-2 text-gray-800">Share & Earn!</h2>
                        <p class="text-gray-600">Invite friends and earn 30 days of Premium when they upgrade!</p>
                    </div>
                    
                    <div class="bg-purple-50 rounded-xl p-4 mb-4">
                        <p class="text-sm text-gray-600 mb-2">Your Referral Code:</p>
                        <div class="flex items-center gap-2">
                            <input type="text" id="referral-code-display" readonly class="flex-1 p-3 border-2 border-purple-300 rounded-lg font-bold text-purple-600 text-center text-lg bg-white">
                            <button onclick="copyReferralCode()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all">
                                📋 Copy
                            </button>
                        </div>
                    </div>

                    <div class="bg-blue-50 rounded-xl p-4 mb-4">
                        <p class="text-sm text-gray-600 mb-2">Your Referral Link:</p>
                        <div class="flex items-center gap-2">
                            <input type="text" id="referral-link-display" readonly class="flex-1 p-2 border-2 border-blue-300 rounded-lg text-sm bg-white">
                            <button onclick="copyReferralLink()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all">
                                🔗 Copy
                            </button>
                        </div>
                    </div>

                    <div class="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 mb-4">
                        <h3 class="font-bold text-gray-900 mb-2">🎯 How it works:</h3>
                        <ul class="text-sm text-gray-900 space-y-1">
                            <li>1️⃣ Share your link with friends</li>
                            <li>2️⃣ They sign up using your code</li>
                            <li>3️⃣ When they upgrade to Premium...</li>
                            <li>4️⃣ You get 30 days FREE! 🎉</li>
                        </ul>
                    </div>

                    <button onclick="closeReferralModal()" class="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-xl transition-all">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    window.showReferralModal = async function() {
        // Create modal if it doesn't exist
        if (!document.getElementById('referral-modal')) {
            createReferralModal();
        }

        // Fetch user's referral code from session
        try {
            const response = await fetch(`${API_BASE_URL}/check_session`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.logged_in && data.referral_code) {
                const referralCode = data.referral_code;
                const referralLink = `${window.location.origin}/register.html?ref=${referralCode}`;
                
                document.getElementById('referral-code-display').value = referralCode;
                document.getElementById('referral-link-display').value = referralLink;
                document.getElementById('referral-modal').classList.remove('hidden');
            } else {
                alert('Please log in to view your referral code');
            }
        } catch (error) {
            console.error('Error fetching referral code:', error);
            alert('Failed to load referral code');
        }
    }

    window.closeReferralModal = function() {
        document.getElementById('referral-modal').classList.add('hidden');
    }

    window.copyReferralCode = async function() {
        const codeInput = document.getElementById('referral-code-display');
        try {
            await navigator.clipboard.writeText(codeInput.value);
            alert('✅ Referral code copied!');
        } catch (err) {
            codeInput.select();
            document.execCommand('copy');
            alert('✅ Referral code copied!');
        }
    }

    window.copyReferralLink = async function() {
        const linkInput = document.getElementById('referral-link-display');
        try {
            await navigator.clipboard.writeText(linkInput.value);
            alert('✅ Referral link copied!');
        } catch (err) {
            linkInput.select();
            document.execCommand('copy');
            alert('✅ Referral link copied!');
        }
    }

    // Add referral button to UI when logged in
    function addReferralButton() {
        // Find the container with login/logout buttons
        const container = document.querySelector('.mt-4.flex.justify-center.items-center.flex-wrap.gap-2');
        if (container && !document.getElementById('referral-btn')) {
            const btn = document.createElement('button');
            btn.id = 'referral-btn';
            btn.className = 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white backdrop-blur-sm rounded-full px-6 py-2 font-semibold transition-all';
            btn.innerHTML = '🎁 Share & Earn';
            btn.addEventListener('click', showReferralModal);
            container.appendChild(btn);
        }
    }

    // ==================== INITIALIZE ====================
    initializeAdSense();
    checkSession();
    markPremiumOptions();
    updateAdButton();
    document.getElementById('input-text').focus();
});