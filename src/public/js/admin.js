// ABJ Admin-Frontend: Produktformular (fetch + CSRF), Bildverwaltung mit Vorschau & Reihenfolge,
// Produktsuche, Farb-Live-Vorschau. Keine Inline-Skripte (CSP-konform).
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function csrf(form) {
    const input = (form && form.querySelector('input[name="_csrf"]')) || document.querySelector('input[name="_csrf"]');
    return input ? input.value : ((document.querySelector('meta[name="csrf-token"]') || {}).content || '');
  }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

  /* ---------- Bestehende Bilder verwalten (Reihenfolge + Entfernen) ---------- */
  const existingWrap = $('#existing-images');
  const dataEl = $('#existing-images-data');
  let existing = [];
  if (existingWrap && dataEl) {
    try { existing = JSON.parse(dataEl.textContent.trim()) || []; } catch { existing = []; }
    renderExisting();
  }
  function renderExisting() {
    existingWrap.innerHTML = '';
    existing.forEach((img, i) => {
      const div = document.createElement('div');
      div.className = 'existing-image';
      div.innerHTML =
        '<img src="' + esc(img.src) + '" alt="Bild ' + (i + 1) + '">' +
        (i === 0 ? '<span class="main-badge">Hauptbild</span>' : '') +
        '<div class="img-tools">' +
          (i > 0 ? '<button type="button" data-mv="-1" title="Nach vorne">‹</button>' : '') +
          (i < existing.length - 1 ? '<button type="button" data-mv="1" title="Nach hinten">›</button>' : '') +
          '<button type="button" data-rm title="Entfernen">✕</button>' +
        '</div>';
      div.querySelector('[data-rm]').addEventListener('click', () => { existing.splice(i, 1); renderExisting(); });
      const mvs = div.querySelectorAll('[data-mv]');
      mvs.forEach((b) => b.addEventListener('click', () => {
        const dir = Number(b.getAttribute('data-mv'));
        const j = i + dir;
        if (j < 0 || j >= existing.length) return;
        [existing[i], existing[j]] = [existing[j], existing[i]];
        renderExisting();
      }));
      existingWrap.appendChild(div);
    });
  }

  /* ---------- Upload-Vorschau (FileReader) ---------- */
  const fileInput = $('[data-file-input]');
  const uploadPreview = $('#upload-preview');
  if (fileInput && uploadPreview) {
    fileInput.addEventListener('change', () => {
      uploadPreview.innerHTML = '';
      Array.from(fileInput.files).slice(0, 8).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        const fig = document.createElement('div');
        fig.className = 'existing-image is-new';
        uploadPreview.appendChild(fig);
        reader.onload = (e) => {
          fig.innerHTML = '<img src="' + e.target.result + '" alt=""><span class="new-badge">Neu</span>';
        };
        reader.readAsDataURL(file);
      });
    });
  }

  /* ---------- Produkt-Formular absenden ---------- */
  const form = $('#product-form');
  if (form) {
    const alertBox = $('#form-alert');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (alertBox) { alertBox.hidden = true; alertBox.textContent = ''; }
      const fd = new FormData(form);
      fd.delete('_csrf');
      fd.set('existing_images', JSON.stringify(existing));
      const action = form.getAttribute('data-action');
      const method = form.getAttribute('data-method') || 'POST';
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Speichern…'; }
      try {
        const res = await fetch(action, {
          method, headers: { 'X-CSRF-Token': csrf(form), Accept: 'application/json' }, body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) { window.location.href = '/admin/produkte'; return; }
        showError(data.error || 'Speichern fehlgeschlagen.', data.issues);
      } catch { showError('Netzwerkfehler. Bitte erneut versuchen.'); }
      finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Speichern'; } }
    });
    function showError(msg, issues) {
      if (!alertBox) { alert(msg); return; }
      let text = msg;
      if (Array.isArray(issues) && issues.length) {
        text += ': ' + issues.map((i) => (i.path ? i.path.join('.') + ' ' : '') + i.message).join(', ');
      }
      alertBox.textContent = text; alertBox.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ---------- Produkt löschen ---------- */
  $$('[data-delete-product]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-product');
      const name = btn.getAttribute('data-name') || 'dieses Produkt';
      if (!confirm('„' + name + '" wirklich löschen?')) return;
      try {
        const res = await fetch('/admin/api/products/' + encodeURIComponent(id), {
          method: 'DELETE', headers: { 'X-CSRF-Token': csrf(null), Accept: 'application/json' },
        });
        if (res.ok) { const row = btn.closest('tr'); if (row) row.remove(); }
        else alert('Löschen fehlgeschlagen.');
      } catch { alert('Netzwerkfehler beim Löschen.'); }
    });
  });

  /* ---------- Produktliste filtern ---------- */
  const filter = $('[data-product-filter]');
  if (filter) {
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      $$('tbody tr', $('.data-table')).forEach((tr) => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* ---------- Farb-Live-Vorschau (Einstellungen) ---------- */
  const colorRow = $('[data-color-row]');
  if (colorRow) {
    const preview = $('[data-color-preview]', colorRow);
    const get = (k) => (colorRow.querySelector('[data-color="' + k + '"]') || {}).value;
    function paint() {
      const a = get('a'), b = get('b'), c = get('c');
      if (preview) preview.style.background = 'linear-gradient(135deg,' + a + ',' + b + ',' + c + ')';
      // sofortige Vorschau im ganzen Admin-Bereich
      document.documentElement.style.setProperty('--accent', a);
      document.documentElement.style.setProperty('--accent-2', b);
      document.documentElement.style.setProperty('--accent-3', c);
      document.documentElement.style.setProperty('--grad', 'linear-gradient(135deg,' + a + ' 0%,' + b + ' 55%,' + c + ' 130%)');
    }
    $$('[data-color]', colorRow).forEach((inp) => inp.addEventListener('input', paint));
    paint();
  }
})();
