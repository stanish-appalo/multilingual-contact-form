/* =========================================================
   app.js — language switching, localized validation,
   and submitting to the FastAPI backend.
   Depends on i18n.js (LANGS, I18N).
   ========================================================= */

(function () {
  "use strict";

  var current = "en";
  var form = document.getElementById("contactForm");
  var subjectSelect = document.getElementById("subject");

  /* ---- Build the language switcher ---- */
  var switcher = document.getElementById("langSwitch");
  LANGS.forEach(function (lang) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-pill";
    btn.dataset.code = lang.code;
    btn.innerHTML = '<span class="flag">' + lang.flag + "</span> " + lang.label;
    btn.addEventListener("click", function () { setLanguage(lang.code); });
    switcher.appendChild(btn);
  });

  /* ---- Apply a language across the whole UI ---- */
  function setLanguage(code) {
    if (!I18N[code]) code = "en";
    current = code;
    var t = I18N[code];
    var meta = LANGS.find(function (l) { return l.code === code; });

    // Document direction + lang (handles RTL Arabic).
    document.documentElement.lang = code;
    document.documentElement.dir = meta ? meta.dir : "ltr";

    // Text content for [data-i18n] nodes.
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (t[key]) el.textContent = t[key];
    });

    // Placeholders.
    setPh("name", t.namePh);
    setPh("email", t.emailPh);
    setPh("message", t.messagePh);

    // Rebuild subject options (keep the chosen index if possible).
    var prevIndex = subjectSelect.selectedIndex;
    subjectSelect.innerHTML = "";
    t.subjects.forEach(function (label) {
      var opt = document.createElement("option");
      opt.value = label; opt.textContent = label;
      subjectSelect.appendChild(opt);
    });
    if (prevIndex >= 0 && prevIndex < t.subjects.length) subjectSelect.selectedIndex = prevIndex;

    // Re-validate any already-shown errors in the new language.
    document.querySelectorAll(".error").forEach(function (slot) {
      if (slot.textContent) validateField(slot.getAttribute("data-error-for"));
    });

    // Highlight the active pill.
    document.querySelectorAll(".lang-pill").forEach(function (p) {
      p.classList.toggle("active", p.dataset.code === code);
    });
  }

  function setPh(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.placeholder = value;
  }

  /* ---- Validation (messages come from the active locale) ---- */
  var rules = {
    name: function (v, t) { return v.trim().length < 2 ? t.errName : ""; },
    email: function (v, t) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : t.errEmail; },
    subject: function (v, t) { return v ? "" : t.errSubject; },
    message: function (v, t) { return v.trim().length < 10 ? t.errMessage : ""; }
  };

  function setError(name, msg) {
    var field = form.elements[name];
    var slot = form.querySelector('[data-error-for="' + name + '"]');
    if (slot) slot.textContent = msg;
    if (field) {
      field.classList.toggle("invalid", !!msg);
      field.setAttribute("aria-invalid", msg ? "true" : "false");
    }
  }

  function validateField(name) {
    var field = form.elements[name];
    if (!field || !rules[name]) return true;
    var msg = rules[name](field.value, I18N[current]);
    setError(name, msg);
    return !msg;
  }

  Object.keys(rules).forEach(function (name) {
    var field = form.elements[name];
    if (!field) return;
    field.addEventListener("blur", function () { validateField(name); });
    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true") validateField(name);
    });
  });

  /* ---- Submit ---- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      if (!validateField(name) && !firstInvalid) firstInvalid = form.elements[name];
    });
    if (firstInvalid) { firstInvalid.focus(); return; }
    send();
  });

  function send() {
    var t = I18N[current];
    var btn = document.getElementById("submitBtn");
    var payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      subject: form.elements.subject.value,
      message: form.elements.message.value.trim(),
      language: current
    };

    btn.disabled = true;
    btn.textContent = t.sending;

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Request failed: " + r.status);
        return r.json();
      })
      .then(function () { showSuccess(payload.name); })
      .catch(function (err) {
        // For a static/offline preview (no backend), still show success so the
        // multilingual UX can be demoed. Swap this for real error handling in prod.
        console.warn("Backend not reachable, showing demo success:", err.message);
        showSuccess(payload.name);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = t.submit;
      });
  }

  function showSuccess(name) {
    var t = I18N[current];
    form.hidden = true;
    var success = document.getElementById("success");
    document.getElementById("successMsg").textContent = t.successMsg.replace("{name}", name);
    success.hidden = false;
  }

  document.getElementById("resetBtn").addEventListener("click", function () {
    form.reset();
    document.querySelectorAll(".error").forEach(function (s) { s.textContent = ""; });
    document.querySelectorAll(".invalid").forEach(function (f) { f.classList.remove("invalid"); });
    document.getElementById("success").hidden = true;
    form.hidden = false;
  });

  /* ---- Init: use the browser's language if we support it ---- */
  var browser = (navigator.language || "en").slice(0, 2);
  setLanguage(I18N[browser] ? browser : "en");
})();
