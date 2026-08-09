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

  // --------------------------------------------------------------------------
  // 1. CONTACT FORM HANDLER
  // --------------------------------------------------------------------------
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const endpoint = contactForm.getAttribute('data-form-endpoint') || contactForm.getAttribute('action');
    const submitBtn = document.getElementById('contact-submit-btn');
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

    contactForm.addEventListener('submit', (e) => {
      if (!endpoint || endpoint.trim() === '' || endpoint === '#') {
        console.warn('Contact form endpoint is not configured in hugo.toml (params.contactFormEndpoint).');
        return;
      }

      e.preventDefault();
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

      const payload = {
        type: 'contact',
        name: name,
        email: email,
        message: message,
        website: website,
        form_time: formTime,
        turnstile_token: turnstileToken
      };

      // Dispatch fetch asynchronously without blocking UI
      fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      }).catch(err => console.error('Background submit error:', err));

      // Optimistic UI response
      contactForm.innerHTML = `
        <div class="contact-success-box" style="padding: 28px 24px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 12px;">✓</div>
          <h3 style="font-family: 'Fraunces', serif; font-size: 22px; color: var(--ink); margin: 0 0 8px 0;">Message Sent!</h3>
          <p style="font-size: 15px; color: var(--ink-soft); margin: 0;">Thank you, ${escapeHTML(name)}. Your note has been delivered successfully.</p>
        </div>
      `;
    });
  }

  // --------------------------------------------------------------------------
  // 2. NEWSLETTER CALLOUT FORM HANDLER
  // --------------------------------------------------------------------------
  const newsletterForms = document.querySelectorAll('.callout-form, #newsletter-form');
  newsletterForms.forEach(nForm => {
    nForm.addEventListener('submit', (e) => {
      const endpoint = nForm.getAttribute('data-form-endpoint') || nForm.getAttribute('action');
      if (!endpoint || endpoint.trim() === '' || endpoint === '#') {
        console.warn('Newsletter endpoint is not configured in hugo.toml (params.contactFormEndpoint).');
        return;
      }

      e.preventDefault();

      const emailInput = nForm.querySelector('input[type="email"]');
      const honeypotInput = nForm.querySelector('input[name="website"]');
      const email = emailInput ? emailInput.value.trim() : '';
      const website = honeypotInput ? honeypotInput.value.trim() : '';

      if (!email || !isValidEmail(email)) {
        alert('Please enter a valid email address.');
        if (emailInput) emailInput.focus();
        return;
      }

      const payload = {
        type: 'newsletter',
        name: 'Newsletter Subscriber',
        email: email,
        message: 'Subscribed to Monthly Field Dispatch',
        website: website,
        form_time: Date.now().toString()
      };

      fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      }).catch(err => console.error('Background newsletter submit error:', err));

      nForm.innerHTML = `
        <div style="font-family: 'Fraunces', serif; font-size: 15px; color: #fff; background: rgba(255,255,255,0.12); padding: 10px 18px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25);">
          You're subscribed! We will notify you soon. <br/>Thank you.
        </div>
      `;
    });
  });
});
