/* Security note: this form's true validation happens server-side in the Apps Script. Client-side checks here are UX only and can be bypassed. */

document.addEventListener('DOMContentLoaded', () => {
  function isValidEmail(emailStr) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Set rendered timestamp on page load for time-based bot check (Layer 2)
  const formTimeInputs = document.querySelectorAll('#contact-form-time');
  formTimeInputs.forEach(input => {
    input.value = Date.now().toString();
  });

  function getDeviceId() {
    const STORAGE_KEY = 'fn_device_id';
    try {
      let deviceId = localStorage.getItem(STORAGE_KEY);
      if (!deviceId) {
        deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(STORAGE_KEY, deviceId);
      }
      return deviceId;
    } catch (err) {
      // localStorage unavailable (private browsing, disabled, etc.) — fall back to a
      // session-only id so the form still works, just without persistence across reloads
      console.warn('localStorage unavailable for device id:', err);
      return 'nostorage_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 15);
    }
  }

  function resetTurnstile() {
    if (typeof turnstile !== 'undefined' && typeof turnstile.reset === 'function') {
      try {
        turnstile.reset();
      } catch (err) {
        console.warn('Turnstile reset error:', err);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 1. CONTACT FORM HANDLER
  // --------------------------------------------------------------------------
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const endpoint = contactForm.getAttribute('data-form-endpoint') || contactForm.getAttribute('action');
    const submitBtn = document.getElementById('contact-submit-btn');
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const feedbackEl = document.getElementById('contact-form-feedback');
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');
    const honeypotInput = document.getElementById('contact-website');
    const timeInput = document.getElementById('contact-form-time');

    function showFeedback(type, messageText) {
      if (!feedbackEl) return;
      feedbackEl.style.display = 'block';
      feedbackEl.className = `contact-feedback-msg ${type}`;
      feedbackEl.textContent = messageText;
    }

    function hideFeedback() {
      if (!feedbackEl) return;
      feedbackEl.style.display = 'none';
      feedbackEl.textContent = '';
    }

    function setSubmitting(isSubmitting) {
      if (!submitBtn) return;
      submitBtn.disabled = isSubmitting;
      if (btnText) {
        btnText.textContent = isSubmitting ? 'Sending...' : 'Send Message →';
      }
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!endpoint || endpoint.trim() === '' || endpoint === '#') {
        console.warn('Contact form endpoint is not configured in hugo.toml (params.contactFormEndpoint).');
        showFeedback('error', 'Contact form is not configured properly.');
        return;
      }

      hideFeedback();

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';
      const website = honeypotInput ? honeypotInput.value.trim() : '';
      const formTime = timeInput ? timeInput.value.trim() : Date.now().toString();

      // Extract Turnstile response token if widget is present on form (Layer 5)
      const turnstileInput = contactForm.querySelector('[name="cf-turnstile-response"]');
      const turnstileToken = turnstileInput ? turnstileInput.value : '';

      // Client-side UX validations
      if (!name) {
        showFeedback('error', 'Please enter your name.');
        if (nameInput) nameInput.focus();
        return;
      }

      if (!email || !isValidEmail(email)) {
        showFeedback('error', 'Please enter a valid email address.');
        if (emailInput) emailInput.focus();
        return;
      }

      if (!message) {
        showFeedback('error', 'Please enter your message.');
        if (messageInput) messageInput.focus();
        return;
      }

      const turnstileWidget = contactForm.querySelector('.cf-turnstile');
      if (turnstileWidget && !turnstileToken) {
        showFeedback('error', 'Please complete the security check.');
        return;
      }

      setSubmitting(true);

      const payload = {
        type: 'contact',
        name: name,
        email: email,
        message: message,
        website: website,
        form_time: formTime,
        turnstile_token: turnstileToken,
        device_id: getDeviceId()
      };

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      })
        .then(response => {
          return response.json();
        })
        .then(result => {
          if (result && result.status === 'success') {
            contactForm.innerHTML = `
              <div class="contact-success-box" style="padding: 28px 24px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 12px;">✓</div>
                <h3 style="font-family: 'Fraunces', serif; font-size: 22px; color: var(--ink); margin: 0 0 8px 0;">Message Sent!</h3>
                <p style="font-size: 15px; color: var(--ink-soft); margin: 0;">Thank you, ${escapeHTML(name)}. Your note has been delivered successfully.</p>
              </div>
            `;
          } else {
            const errorMsg = (result && result.message) ? result.message : 'Submission failed. Please try again.';
            showFeedback('error', errorMsg);
            setSubmitting(false);
            resetTurnstile();
          }
        })
        .catch(err => {
          console.error('Contact form submission error:', err);
          showFeedback('error', 'An error occurred while sending your note. Please try again.');
          setSubmitting(false);
          resetTurnstile();
        });
    });
  }

  // --------------------------------------------------------------------------
  // 2. NEWSLETTER CALLOUT FORM HANDLER
  // --------------------------------------------------------------------------
  const newsletterForms = document.querySelectorAll('.callout-form, #newsletter-form');
  newsletterForms.forEach(nForm => {
    const submitBtn = nForm.querySelector('button[type="submit"], #newsletter-submit-btn');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Subscribe';

    function showNewsletterFeedback(type, messageText) {
      let feedbackEl = nForm.querySelector('.newsletter-feedback-msg, #newsletter-form-feedback');
      if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.className = `newsletter-feedback-msg ${type}`;
        feedbackEl.setAttribute('aria-live', 'polite');
        feedbackEl.style.marginTop = '8px';
        feedbackEl.style.fontSize = '13.5px';
        feedbackEl.style.lineHeight = '1.4';
        nForm.appendChild(feedbackEl);
      }
      feedbackEl.style.display = 'block';
      feedbackEl.className = `newsletter-feedback-msg ${type}`;
      feedbackEl.style.color = type === 'error' ? '#f87171' : 'var(--ink)';
      feedbackEl.textContent = messageText;
    }

    function hideNewsletterFeedback() {
      const feedbackEl = nForm.querySelector('.newsletter-feedback-msg, #newsletter-form-feedback');
      if (feedbackEl) {
        feedbackEl.style.display = 'none';
        feedbackEl.textContent = '';
      }
    }

    function setNewsletterSubmitting(isSubmitting) {
      if (!submitBtn) return;
      submitBtn.disabled = isSubmitting;
      submitBtn.textContent = isSubmitting ? 'Subscribing...' : originalBtnText;
    }

    nForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const endpoint = nForm.getAttribute('data-form-endpoint') || nForm.getAttribute('action');
      if (!endpoint || endpoint.trim() === '' || endpoint === '#') {
        console.warn('Newsletter endpoint is not configured in hugo.toml (params.contactFormEndpoint).');
        showNewsletterFeedback('error', 'Newsletter form is not configured properly.');
        return;
      }

      hideNewsletterFeedback();

      const emailInput = nForm.querySelector('input[type="email"]');
      const honeypotInput = nForm.querySelector('input[name="website"]');
      const email = emailInput ? emailInput.value.trim() : '';
      const website = honeypotInput ? honeypotInput.value.trim() : '';

      // Extract Turnstile response token if widget is present on form (Layer 5)
      const turnstileInput = nForm.querySelector('[name="cf-turnstile-response"]');
      const turnstileToken = turnstileInput ? turnstileInput.value : '';

      if (!email || !isValidEmail(email)) {
        showNewsletterFeedback('error', 'Please enter a valid email address.');
        if (emailInput) emailInput.focus();
        return;
      }

      const turnstileWidget = nForm.querySelector('.cf-turnstile');
      if (turnstileWidget && !turnstileToken) {
        showNewsletterFeedback('error', 'Please complete the security check.');
        return;
      }

      setNewsletterSubmitting(true);

      const payload = {
        type: 'newsletter',
        name: 'Newsletter Subscriber',
        email: email,
        message: 'Subscribed to Monthly Field Dispatch',
        website: website,
        form_time: Date.now().toString(),
        turnstile_token: turnstileToken,
        device_id: getDeviceId()
      };

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      })
        .then(response => {
          return response.json();
        })
        .then(result => {
          if (result && result.status === 'success') {
            nForm.innerHTML = `
              <div style="font-family: 'Fraunces', serif; font-size: 15px; color: #fff; background: rgba(255,255,255,0.12); padding: 10px 18px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25);">
                You're subscribed! We will notify you soon. <br/>Thank you.
              </div>
            `;
          } else {
            const errorMsg = (result && result.message) ? result.message : 'Subscription failed. Please try again.';
            showNewsletterFeedback('error', errorMsg);
            setNewsletterSubmitting(false);
            resetTurnstile();
          }
        })
        .catch(err => {
          console.error('Newsletter submission error:', err);
          showNewsletterFeedback('error', 'An error occurred while subscribing. Please try again.');
          setNewsletterSubmitting(false);
          resetTurnstile();
        });
    });
  });
});
