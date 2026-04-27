// S3 ISS. Interactions, language toggle, form validation

(function () {
  'use strict';

  // ===== Header scroll state =====
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }, { passive: true });

  // ===== Reveal on scroll =====
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // ===== Language toggle =====
  const langToggle = document.getElementById('langToggle');
  const langPrompt = document.getElementById('langPrompt');
  const switchHindi = document.getElementById('switchHindi');
  const dismissLang = document.getElementById('dismissLang');

  // Bilingual mailto subject + body. Swapped on language toggle
  const MAILTO_BASE = 'mailto:avinash@s3iss.in';
  const MAILTO_TEMPLATES = {
    en: {
      subject: "Let's talk about fire safety",
      body:
        "Hi Avinash,\n\n" +
        "I'm interested in fire safety solutions for my [building / factory / office] in [city].\n\n" +
        "Please get in touch.\n\n" +
        "Thanks,\n[Your name]",
    },
    hi: {
      subject: 'अग्नि सुरक्षा के बारे में बात करते हैं',
      body:
        "नमस्ते अविनाश जी,\n\n" +
        "मुझे [इमारत / फैक्ट्री / ऑफिस] के लिए अग्नि सुरक्षा समाधान के बारे में जानना है। यह [शहर] में है।\n\n" +
        "कृपया संपर्क करें।\n\n" +
        "धन्यवाद,\n[आपका नाम]",
    },
  };

  function buildMailto(lang) {
    const t = MAILTO_TEMPLATES[lang] || MAILTO_TEMPLATES.en;
    return MAILTO_BASE +
      '?subject=' + encodeURIComponent(t.subject) +
      '&body=' + encodeURIComponent(t.body);
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.body.classList.toggle('hi', lang === 'hi');

    document.querySelectorAll('[data-en]').forEach((el) => {
      const val = el.getAttribute('data-' + lang);
      if (val !== null) el.textContent = val;
    });
    document.querySelectorAll('[data-en-ph]').forEach((el) => {
      const val = el.getAttribute('data-' + lang + '-ph');
      if (val !== null) el.placeholder = val;
    });

    // Swap mailto hrefs to match language
    const mailtoHref = buildMailto(lang);
    document.querySelectorAll('.mailto-cta').forEach((el) => {
      el.setAttribute('href', mailtoHref);
    });

    langToggle.querySelector('.lang-en').classList.toggle('active', lang === 'en');
    langToggle.querySelector('.lang-hi').classList.toggle('active', lang === 'hi');

    localStorage.setItem('s3iss-lang', lang);
  }

  langToggle.addEventListener('click', () => {
    const cur = localStorage.getItem('s3iss-lang') || 'en';
    applyLang(cur === 'en' ? 'hi' : 'en');
  });

  const stored = localStorage.getItem('s3iss-lang');
  if (!stored) {
    setTimeout(() => langPrompt.classList.add('show'), 1800);
  } else if (stored === 'hi') {
    applyLang('hi');
  }

  switchHindi?.addEventListener('click', () => {
    applyLang('hi');
    langPrompt.classList.remove('show');
  });
  dismissLang?.addEventListener('click', () => {
    applyLang('en');
    langPrompt.classList.remove('show');
  });

  // ===== Mobile nav drawer =====
  const navToggle = document.getElementById('navToggle');
  const nav = document.querySelector('.nav');
  let scrim = null;

  function ensureScrim() {
    if (scrim) return scrim;
    scrim = document.createElement('div');
    scrim.className = 'nav-scrim';
    scrim.addEventListener('click', closeMenu);
    document.body.appendChild(scrim);
    return scrim;
  }
  function openMenu() {
    nav.classList.add('open');
    ensureScrim().classList.add('open');
    document.body.classList.add('nav-open');
    navToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    nav.classList.remove('open');
    scrim?.classList.remove('open');
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  navToggle?.addEventListener('click', () => {
    if (nav.classList.contains('open')) closeMenu(); else openMenu();
  });
  // Close drawer when a nav link is clicked
  nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu();
  });

  // ===== Smooth scroll =====
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth',
      });
    });
  });

  // ===== Video error fallback =====
  document.querySelectorAll('.service-video video, .hero-video').forEach((v) => {
    const onErr = () => { v.style.display = 'none'; };
    v.addEventListener('error', onErr);
    v.querySelectorAll('source').forEach((s) => s.addEventListener('error', onErr));
  });

  // ===== Form validation =====
  const form = document.getElementById('auditForm');
  if (!form) return;

  const successMsg = document.getElementById('f-success');
  const submitBtn = document.getElementById('f-submit');

  // Validators
  const validators = {
    'f-name': (v) => {
      const trimmed = v.trim();
      if (trimmed.length < 2) return false;
      // letters (latin + devanagari), spaces, common name chars
      return /^[A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s.'-]{1,59}$/.test(trimmed);
    },
    'f-phone': (v) => {
      const cleaned = v.replace(/\D/g, '');
      // strip leading 91 if user typed with country code
      const digits = cleaned.length === 12 && cleaned.startsWith('91') ? cleaned.slice(2) : cleaned;
      return /^[6-9]\d{9}$/.test(digits);
    },
    'f-email': (v) => {
      const trimmed = v.trim();
      // tighter than HTML5 default. Must have proper tld
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed) && trimmed.length <= 254;
    },
    'f-city': (v) => v.length > 0,
    'f-place': (v) => v.length > 0,
  };

  function validateField(id) {
    const el = document.getElementById(id);
    if (!el) return true;
    const wrap = el.closest('.field');
    const val = el.value;
    const ok = validators[id] ? validators[id](val) : true;

    // don't show error if user hasn't touched the field yet
    if (!el.dataset.touched && !val) {
      wrap.classList.remove('valid', 'invalid');
      return ok;
    }

    wrap.classList.toggle('valid', ok);
    wrap.classList.toggle('invalid', !ok);
    return ok;
  }

  // Live validation on blur and input
  Object.keys(validators).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      el.dataset.touched = '1';
      validateField(id);
    });
    el.addEventListener('input', () => {
      if (el.dataset.touched) validateField(id);
    });
    el.addEventListener('change', () => {
      el.dataset.touched = '1';
      validateField(id);
    });
  });

  // Phone number. Strip non-digits as user types, cap at 10
  const phoneEl = document.getElementById('f-phone');
  phoneEl?.addEventListener('input', () => {
    let digits = phoneEl.value.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    if (digits.length > 10) digits = digits.slice(0, 10);
    phoneEl.value = digits;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Mark all touched and validate
    let allOk = true;
    Object.keys(validators).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.dataset.touched = '1';
      if (!validateField(id)) allOk = false;
    });

    if (!allOk) {
      // scroll to first invalid field
      const first = form.querySelector('.field.invalid');
      first?.querySelector('input,select')?.focus();
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // All good. Show success state
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    const lang = localStorage.getItem('s3iss-lang') || 'en';
    submitBtn.textContent = lang === 'hi' ? 'भेजा गया ✓' : 'Sent ✓';
    successMsg.hidden = false;
    successMsg.textContent = successMsg.getAttribute('data-' + lang) || successMsg.getAttribute('data-en');

    // In production: POST form data here.
    // const data = {
    //   name: document.getElementById('f-name').value.trim(),
    //   phone: document.getElementById('f-phone').value.trim(),
    //   email: document.getElementById('f-email').value.trim(),
    //   city: document.getElementById('f-city').value,
    //   place: document.getElementById('f-place').value,
    // };
    // fetch('/api/lead', { method: 'POST', body: JSON.stringify(data) });
  });
})();
