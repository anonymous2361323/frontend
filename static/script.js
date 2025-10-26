const API_BASE_URL = 'https://back-thbr.onrender.com';

// ===== AD REWARD SYSTEM =====
const AD_REWARD_SYSTEM = {
    adsWatchedToday: 0,
    requiredAdsForPremium: 5,
    premiumExpiryKey: 'ad_premium_expiry',
    adsWatchedKey: 'ads_watched_count',
    lastResetKey: 'ads_last_reset'
};

function hasAdPremium() {
    const expiry = localStorage.getItem(AD_REWARD_SYSTEM.premiumExpiryKey);
    if (!expiry) return false;
    return new Date(expiry) > new Date();
}

function resetAdsIfNewDay() {
    const lastReset = localStorage.getItem(AD_REWARD_SYSTEM.lastResetKey);
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
        localStorage.setItem(AD_REWARD_SYSTEM.adsWatchedKey, '0');
        localStorage.setItem(AD_REWARD_SYSTEM.lastResetKey, today);
        AD_REWARD_SYSTEM.adsWatchedToday = 0;
    } else {
        AD_REWARD_SYSTEM.adsWatchedToday = parseInt(localStorage.getItem(AD_REWARD_SYSTEM.adsWatchedKey) || '0');
    }
}

function onAdWatched() {
    AD_REWARD_SYSTEM.adsWatchedToday++;
    localStorage.setItem(AD_REWARD_SYSTEM.adsWatchedKey, AD_REWARD_SYSTEM.adsWatchedToday.toString());
    
    if (AD_REWARD_SYSTEM.adsWatchedToday >= AD_REWARD_SYSTEM.requiredAdsForPremium) {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        localStorage.setItem(AD_REWARD_SYSTEM.premiumExpiryKey, expiry.toISOString());
        
        alert('🎉 Congratulations! You earned 24 hours of Premium access!');
        location.reload();
    } else {
        const remaining = AD_REWARD_SYSTEM.requiredAdsForPremium - AD_REWARD_SYSTEM.adsWatchedToday;
        alert(`✅ Ad watched! Watch ${remaining} more ad${remaining > 1 ? 's' : ''} to unlock 24hrs Premium`);
        updateAdProgress();
    }
}

function updateAdProgress() {
    const progressEl = document.getElementById('ad-progress');
    if (progressEl) {
        const remaining = AD_REWARD_SYSTEM.requiredAdsForPremium - AD_REWARD_SYSTEM.adsWatchedToday;
        progressEl.textContent = `${AD_REWARD_SYSTEM.adsWatchedToday}/${AD_REWARD_SYSTEM.requiredAdsForPremium} ads watched today. ${remaining} more for 24hr Premium!`;
    }
}

function showAdModal() {
    const modal = document.getElementById('ad-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // Simulate ad loading (replace with actual ad network SDK)
        trackEvent('ad_started', { ad_number: AD_REWARD_SYSTEM.adsWatchedToday + 1 });
    }
}

function closeAdModal() {
    const modal = document.getElementById('ad-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Simulate ad completion (replace with actual ad network callback)
function simulateAdCompletion() {
    trackEvent('ad_completed', { ad_number: AD_REWARD_SYSTEM.adsWatchedToday + 1 });
    onAdWatched();
    closeAdModal();
}

// ===== REFERRAL SYSTEM =====
const REFERRAL_SYSTEM = {
    getReferralCode() {
        return localStorage.getItem('user_referral_code');
    },
    
    setReferralCode(code) {
        localStorage.setItem('user_referral_code', code);
    },
    
    getIncomingReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref');
    },
    
    storeIncomingReferral(code) {
        localStorage.setItem('incoming_referral', code);
        // Track referral click
        trackEvent('referral_click', { referral_code: code });
    },
    
    async fetchUserReferralData() {
        try {
            const response = await fetch(`${API_BASE_URL}/get_referral_data`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.referral_code) {
                this.setReferralCode(data.referral_code);
                this.updateReferralUI(data);
            }
        } catch (error) {
            console.error('Failed to fetch referral data:', error);
        }
    },
    
    updateReferralUI(data) {
        const linkEl = document.getElementById('referral-link');
        const countEl = document.getElementById('referral-count');
        const rewardsEl = document.getElementById('pending-rewards');
        
        if (linkEl && data.referral_code) {
            linkEl.value = `https://nextlogicai.com/register.html?ref=${data.referral_code}`;
        }
        if (countEl) {
            countEl.textContent = data.referral_count || 0;
        }
        if (rewardsEl) {
            rewardsEl.textContent = `${data.pending_rewards || 0} months free`;
        }
    }
};

function copyReferralLink() {
    const linkEl = document.getElementById('referral-link');
    if (linkEl) {
        linkEl.select();
        navigator.clipboard.writeText(linkEl.value).then(() => {
            trackEvent('referral_link_copied');
            alert('✅ Referral link copied to clipboard!');
        });
    }
}

// ===== HISTORY/SAVE SYSTEM =====
const HISTORY_SYSTEM = {
    async saveRemix(originalText, remixedText, remixType) {
        try {
            const response = await fetch(`${API_BASE_URL}/save_remix`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_text: originalText,
                    remixed_text: remixedText,
                    remix_type: remixType
                })
            });
            
            if (response.ok) {
                trackEvent('remix_saved', { remix_type: remixType });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to save remix:', error);
            return false;
        }
    },
    
    async getHistory() {
        try {
            const response = await fetch(`${API_BASE_URL}/get_history`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.history || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch history:', error);
            return [];
        }
    },
    
    async loadHistoryUI() {
        const history = await this.getHistory();
        const container = document.getElementById('history-container');
        
        if (!container) return;
        
        if (history.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-8">No saved remixes yet. Start creating!</p>';
            return;
        }
        
        container.innerHTML = history.map((item, index) => `
            <div class="bg-white/10 rounded-xl p-4 mb-4">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-sm font-semibold bg-purple-500/50 px-3 py-1 rounded-full">${this.formatRemixType(item.remix_type)}</span>
                    <span class="text-xs text-gray-300">${this.formatDate(item.created_at)}</span>
                </div>
                <details class="mt-2">
                    <summary class="cursor-pointer text-sm font-semibold mb-2">View Original & Remixed Text</summary>
                    <div class="bg-black/20 rounded p-3 mt-2">
                        <p class="text-xs text-gray-400 mb-1">Original:</p>
                        <p class="text-sm mb-3">${this.truncate(item.original_text)}</p>
                        <p class="text-xs text-gray-400 mb-1">Remixed:</p>
                        <p class="text-sm">${this.truncate(item.remixed_text)}</p>
                    </div>
                </details>
                <button onclick="HISTORY_SYSTEM.loadRemix(${index})" class="mt-2 text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded">
                    Load This Remix
                </button>
            </div>
        `).join('');
    },
    
    formatRemixType(type) {
        const types = {
            tweet: '🐦 Twitter',
            linkedin: '💼 LinkedIn',
            email: '📧 Email',
            blog: '📝 Blog',
            // Add more mappings
        };
        return types[type] || type;
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
    
    truncate(text, length = 100) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },
    
    async loadRemix(index) {
        const history = await this.getHistory();
        if (history[index]) {
            document.getElementById('input-text').value = history[index].original_text;
            document.getElementById('output-text').textContent = history[index].remixed_text;
            document.getElementById('remix-type').value = history[index].remix_type;
            document.getElementById('copy-btn').classList.remove('hidden');
            document.getElementById('history-modal').classList.add('hidden');
            trackEvent('history_loaded');
        }
    }
};

// ===== ANALYTICS FUNCTIONS =====
function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
}

function trackPageView(pageName) {
    trackEvent('page_view', {
        page_title: pageName,
        page_location: window.location.href
    });
}

function trackRegistration() {
    trackEvent('sign_up', {
        method: 'email'
    });
}

function trackLogin() {
    trackEvent('login', {
        method: 'email'
    });
}

function trackRemix(remixType, userTier) {
    trackEvent('remix_content', {
        content_type: remixType,
        user_tier: userTier
    });
}

function trackPaywallShown(trigger) {
    trackEvent('view_paywall', {
        trigger: trigger
    });
}

function trackSubscription(subscriptionID) {
    trackEvent('purchase', {
        transaction_id: subscriptionID,
        value: 4.99,
        currency: 'USD',
        items: [{
            item_id: 'premium_monthly',
            item_name: 'Premium Subscription',
            price: 4.99,
            quantity: 1
        }]
    });
}

function trackButtonClick(buttonName) {
    trackEvent('button_click', {
        button_name: buttonName
    });
}

function trackContactForm() {
    trackEvent('contact_form_submit', {
        form_name: 'main_contact'
    });
}

// ===== MAIN APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    // User state
    let userTier = 'guest';
    let guestUsesLeft = 3;
    let isLoggedIn = false;
    let isPaid = false;

    // Initialize systems
    resetAdsIfNewDay();
    
    // Check for incoming referral
    const incomingRef = REFERRAL_SYSTEM.getIncomingReferral();
    if (incomingRef) {
        REFERRAL_SYSTEM.storeIncomingReferral(incomingRef);
    }

    const premiumOptions = [
        'email', 'ad', 'blog', 'story', 'smalltalk', 
        'interview', 'salespitch', 'thanks', 'followup',
        'apology', 'reminder', 'agenda'
    ];

    const freeAccountOptions = [
        'tweet', 'linkedin', 'instagram', 
        'youtube', 'press', 'casual'
    ];

    function getUserTier() {
        if (hasAdPremium()) return 'ad_premium';
        if (isPaid) return 'premium';
        if (isLoggedIn) return 'free';
        return 'guest';
    }

    function updateUI() {
        const counter = document.getElementById('uses-counter');
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const upgradeBtn = document.getElementById('upgrade-btn');
        const remixBtn = document.getElementById('remix-btn');
        const historyBtn = document.getElementById('view-history-btn');
        
        userTier = getUserTier();

        if (userTier === 'ad_premium') {
            const expiry = new Date(localStorage.getItem(AD_REWARD_SYSTEM.premiumExpiryKey));
            const hoursLeft = Math.ceil((expiry - new Date()) / 3600000);
            
            loginBtn.classList.add('hidden');
            registerBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            upgradeBtn.classList.remove('hidden');
            counter.textContent = `🎁 Ad Premium - ${hoursLeft}hrs left!`;
            counter.className = 'font-semibold bg-gradient-to-r from-blue-400 to-purple-500 backdrop-blur-sm rounded-full px-6 py-2';
            remixBtn.disabled = false;
        } else if (isPaid) {
            loginBtn.classList.add('hidden');
            registerBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            upgradeBtn.classList.add('hidden');
            counter.textContent = '⭐ Premium - Unlimited remixes!';
            counter.className = 'font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 backdrop-blur-sm rounded-full px-6 py-2';
            remixBtn.disabled = false;
        } else if (isLoggedIn) {
            loginBtn.classList.add('hidden');
            registerBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            upgradeBtn.classList.remove('hidden');
            counter.textContent = '🎉 Free Account - Unlimited basic remixes!';
            counter.className = 'font-semibold bg-green-500/80 backdrop-blur-sm rounded-full px-6 py-2';
            remixBtn.disabled = false;
        } else {
            loginBtn.classList.remove('hidden');
            registerBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            upgradeBtn.classList.add('hidden');
            counter.textContent = `🆓 Guest - ${guestUsesLeft} remixes left`;
            counter.className = 'font-semibold bg-white/20 backdrop-blur-sm rounded-full px-6 py-2';
            remixBtn.disabled = false;
        }
        
        updateAdProgress();
    }

    function showError(message) {
        const output = document.getElementById('output-text');
        output.textContent = `❌ Error: ${message}`;
        document.getElementById('copy-btn').classList.add('hidden');
    }

    function getGuestUsesLeft() {
        const stored = localStorage.getItem('guestUsesLeft');
        return stored ? parseInt(stored) : 3;
    }

    function setGuestUsesLeft(uses) {
        localStorage.setItem('guestUsesLeft', uses.toString());
        guestUsesLeft = uses;
    }

    async function checkSession() {
        try {
            const response = await fetch(`${API_BASE_URL}/check_session`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            isLoggedIn = data.logged_in;
            isPaid = data.is_paid || false;
            
            if (!isLoggedIn) {
                guestUsesLeft = getGuestUsesLeft();
            }
            
            if (isLoggedIn) {
                REFERRAL_SYSTEM.fetchUserReferralData();
            }
            
            updateUI();
        } catch (error) {
            console.error('Session check failed:', error);
            guestUsesLeft = getGuestUsesLeft();
            updateUI();
        }
    }

    function canAccessFeature(remixType) {
        if (hasAdPremium() || isPaid) {
            return { canAccess: true, reason: null };
        }
        
        if (premiumOptions.includes(remixType)) {
            return { canAccess: false, reason: 'premium_required' };
        }
        
        if (!isLoggedIn) {
            if (guestUsesLeft <= 0) {
                return { canAccess: false, reason: 'guest_limit' };
            }
            if (!freeAccountOptions.includes(remixType)) {
                return { canAccess: false, reason: 'account_required' };
            }
        }
        
        return { canAccess: true, reason: null };
    }

    // ===== EVENT LISTENERS =====
    
    // Watch ads button
    document.getElementById('watch-ads-btn')?.addEventListener('click', () => {
        trackButtonClick('watch_ads');
        showAdModal();
    });
    
    // Ad modal close
    document.getElementById('close-ad-modal')?.addEventListener('click', () => {
        closeAdModal();
    });
    
    // Complete ad button (simulated)
    document.getElementById('complete-ad-btn')?.addEventListener('click', () => {
        simulateAdCompletion();
    });
    
    // View history button
    document.getElementById('view-history-btn')?.addEventListener('click', () => {
        trackButtonClick('view_history');
        if (!isLoggedIn) {
            alert('Please log in to view your remix history');
            return;
        }
        document.getElementById('history-modal')?.classList.remove('hidden');
        HISTORY_SYSTEM.loadHistoryUI();
    });
    
    // Close history modal
    document.getElementById('close-history-btn')?.addEventListener('click', () => {
        document.getElementById('history-modal')?.classList.add('hidden');
    });
    
    // Save remix button
    document.getElementById('save-remix-btn')?.addEventListener('click', async () => {
        trackButtonClick('save_remix');
        if (!isLoggedIn) {
            alert('Please log in to save remixes');
            return;
        }
        
        const original = document.getElementById('input-text').value;
        const remixed = document.getElementById('output-text').textContent;
        const type = document.getElementById('remix-type').value;
        
        const saved = await HISTORY_SYSTEM.saveRemix(original, remixed, type);
        if (saved) {
            alert('✅ Remix saved to your history!');
        } else {
            alert('❌ Failed to save remix');
        }
    });

    document.getElementById('register-btn')?.addEventListener('click', () => {
        trackButtonClick('register');
    });

    document.getElementById('upgrade-btn')?.addEventListener('click', () => {
        trackButtonClick('upgrade_button');
        trackPaywallShown('upgrade_button');
        document.getElementById('paywall').classList.remove('hidden');
    });

    document.getElementById('upgrade-cta-btn')?.addEventListener('click', () => {
        trackButtonClick('upgrade_cta');
        trackPaywallShown('upgrade_cta');
        document.getElementById('paywall').classList.remove('hidden');
    });

    document.getElementById('remix-btn').addEventListener('click', async () => {
        trackButtonClick('remix');
        const remixBtn = document.getElementById('remix-btn');
        const inputText = document.getElementById('input-text').value.trim();
        const remixType = document.getElementById('remix-type').value;
        
        if (!inputText) {
            showError('Please enter some text to remix!');
            return;
        }

        const accessCheck = canAccessFeature(remixType);
        if (!accessCheck.canAccess) {
            if (accessCheck.reason === 'premium_required') {
                trackPaywallShown('premium_feature');
                document.getElementById('paywall').classList.remove('hidden');
            } else if (accessCheck.reason === 'guest_limit') {
                trackPaywallShown('guest_limit');
                document.getElementById('guest-limit-modal').classList.remove('hidden');
            } else if (accessCheck.reason === 'account_required') {
                trackPaywallShown('account_required');
                document.getElementById('guest-limit-modal').classList.remove('hidden');
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: inputText, 
                    'remix-type': remixType,
                    is_guest: !isLoggedIn
                })
            });

            const data = await response.json();

            if (response.ok && data.output) {
                trackRemix(remixType, userTier);
                document.getElementById('output-text').textContent = data.output;
                document.getElementById('copy-btn').classList.remove('hidden');
                document.getElementById('save-remix-btn')?.classList.remove('hidden');
                
                if (!isLoggedIn) {
                    guestUsesLeft = Math.max(0, guestUsesLeft - 1);
                    setGuestUsesLeft(guestUsesLeft);
                    
                    if (guestUsesLeft <= 0) {
                        trackPaywallShown('guest_limit_reached');
                        setTimeout(() => {
                            document.getElementById('guest-limit-modal').classList.remove('hidden');
                        }, 1000);
                    }
                }
                
                checkSession();
            } else {
                if (data.requiresPremium) {
                    trackPaywallShown('premium_required_backend');
                    document.getElementById('paywall').classList.remove('hidden');
                } else if (data.error && data.error.includes('log in')) {
                    trackPaywallShown('login_required');
                    document.getElementById('guest-limit-modal').classList.remove('hidden');
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

    document.getElementById('copy-btn').addEventListener('click', async () => {
        trackButtonClick('copy');
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

    document.getElementById('login-btn').addEventListener('click', () => {
        trackButtonClick('login');
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('login-error').classList.add('hidden');
    });

    document.getElementById('close-login-btn').addEventListener('click', () => {
        trackButtonClick('close_login');
        document.getElementById('login-modal').classList.add('hidden');
    });

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
                trackLogin();
                isLoggedIn = true;
                isPaid = data.is_paid;
                document.getElementById('login-modal').classList.add('hidden');
                REFERRAL_SYSTEM.fetchUserReferralData();
                updateUI();
                alert('Login successful! 🎉');
            } else {
                document.getElementById('login-error').textContent = data.error || 'Login failed';
                document.getElementById('login-error').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Login error:', error);
            document.getElementById('login-error').textContent = 'Failed to connect to server';
            document.getElementById('login-error').classList.remove('hidden');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        trackButtonClick('logout');
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'GET',
                credentials: 'include'
            });
            isLoggedIn = false;
            isPaid = false;
            guestUsesLeft = getGuestUsesLeft();
            updateUI();
            alert('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

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
                trackContactForm();
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

    document.getElementById('close-paywall-btn').addEventListener('click', () => {
        trackButtonClick('close_paywall');
        document.getElementById('paywall').classList.add('hidden');
    });

    document.getElementById('close-guest-limit-btn')?.addEventListener('click', () => {
        trackButtonClick('close_guest_limit');
        document.getElementById('guest-limit-modal').classList.add('hidden');
    });

    document.getElementById('show-premium-from-guest')?.addEventListener('click', () => {
        trackButtonClick('show_premium_from_guest');
        document.getElementById('guest-limit-modal').classList.add('hidden');
        document.getElementById('paywall').classList.remove('hidden');
    });

    if (typeof paypal !== 'undefined') {
        paypal.Buttons({
            createSubscription: function(data, actions) {
                return actions.subscription.create({
                    plan_id: 'P-5LK680852J287884DNDUFRKA'
                });
            },
            onApprove: function(data, actions) {
                trackSubscription(data.subscriptionID);
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

    checkSession();
    document.getElementById('input-text').focus();
    trackPageView('NextLogicAI Home');
});