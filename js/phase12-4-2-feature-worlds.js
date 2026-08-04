(() => {
  'use strict';

  const body = document.body;
  const scentModal = document.getElementById('scent16Modal');
  const birthdayModals = [
    'birthdayExperienceModal','birthdayCalendarModal','birthdayCommentModal',
    'birthdayAlbumModal','birthdayHistoryModal'
  ].map(id => document.getElementById(id)).filter(Boolean);
  const passModal = document.getElementById('passportDetailModal');
  const passCard = document.querySelector('.passport-detail-card');

  function isOpen(node) {
    if (!node) return false;
    return node.classList.contains('is-open') || node.getAttribute('aria-hidden') === 'false';
  }

  function syncWorldClass() {
    body.classList.toggle('is-scent-world', isOpen(scentModal));
    body.classList.toggle('is-birthday-world', birthdayModals.some(isOpen));
    body.classList.toggle('is-pass-world', isOpen(passModal));
  }

  const observer = new MutationObserver(syncWorldClass);
  [scentModal, passModal, ...birthdayModals].filter(Boolean).forEach(node => {
    observer.observe(node, { attributes: true, attributeFilter: ['class','aria-hidden'] });
  });

  function addScentPetals() {
    const panel = document.querySelector('.scent16-panel');
    if (!panel || panel.querySelector('.phase1242-petal')) return;
    const petals = ['🌸','✿','❀','·'];
    for (let i = 0; i < 9; i += 1) {
      const petal = document.createElement('i');
      petal.className = 'phase1242-petal';
      petal.textContent = petals[i % petals.length];
      petal.style.left = `${7 + (i * 11) % 86}%`;
      petal.style.top = `${-12 - (i % 3) * 16}px`;
      petal.style.setProperty('--fall', `${6.4 + (i % 4) * .9}s`);
      petal.style.setProperty('--delay', `${-i * .72}s`);
      petal.style.setProperty('--drift', `${(i % 2 ? 1 : -1) * (16 + i * 3)}px`);
      petal.setAttribute('aria-hidden', 'true');
      panel.appendChild(petal);
    }
  }

  if (scentModal) {
    const scentObserver = new MutationObserver(() => {
      if (isOpen(scentModal)) addScentPetals();
    });
    scentObserver.observe(scentModal, { attributes: true, attributeFilter: ['class','aria-hidden'] });
  }

  if (passModal && passCard) {
    const passObserver = new MutationObserver(() => {
      if (!isOpen(passModal)) return;
      passCard.classList.remove('phase1242-card-shine');
      requestAnimationFrame(() => passCard.classList.add('phase1242-card-shine'));
    });
    passObserver.observe(passModal, { attributes: true, attributeFilter: ['class','aria-hidden'] });
  }

  syncWorldClass();
})();
