/* India language toggle
   English is intentionally the default for the clean in.biosunlocktool.com root.
   Hindi is an explicit, client-side presentation choice: the URL and canonical
   route stay stable, so campaign links and analytics do not split by language. */
(function () {
  'use strict';

  var root = document.documentElement;
  if (root.dataset.market !== 'india') return;

  var header = document.querySelector('.header');
  if (!header) return;

  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'language-toggle';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.setAttribute('aria-label', 'हिन्दी में बदलें');
  toggle.textContent = 'हिन्दी';
  toggle.hidden = false;

  var headerCta = header.querySelector('.header-cta');
  if (headerCta) header.insertBefore(toggle, headerCta);
  else header.appendChild(toggle);

  var entries = [];
  function text(selector, hindi, options) {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
    nodes.forEach(function (node) {
      entries.push({ node: node, hindi: hindi, mode: options && options.mode });
    });
  }

  function label(selector, hindi) {
    document.querySelectorAll(selector).forEach(function (node) {
      entries.push({ node: node, hindi: hindi, mode: 'label' });
    });
  }

  text('.nav-pill:nth-child(1)', 'उत्पाद');
  text('.nav-pill:nth-child(2)', 'यह कैसे काम करता है');
  text('.nav-pill:nth-child(3)', 'गाइड');
  text('.header-cta .cta-text', 'अभी खरीदें');
  text('.header-cta', 'अभी खरीदें', { mode: 'headerCta' });
  text('.nav-toggle', 'मेनू खोलें', { mode: 'ariaLabel' });
  text('.eyebrow', 'Dell BIOS पासवर्ड रीसेट टूल');
  text('.title-desc', 'किसी भी Dell BIOS पासवर्ड को हटाएँ या वापस पाएँ — admin, system या HDD। कोड तुरंत पाएँ।');
  text('.hero-trust', '2,500+ ग्राहकों का भरोसा · कोड तुरंत डिलीवरी');
  text('.section-title', 'उत्पाद', { mode: 'sectionTitle' });
  text('.products .product:nth-child(1) h3', 'रीसेट टूल');
  text('.products .product:nth-child(1) p', 'Service Tag का उपयोग करके किसी भी Dell लैपटॉप के लिए BIOS पासवर्ड रीसेट कोड बनाएँ।');
  text('.products .product:nth-child(2) h3', 'रिमूव टूल');
  text('.products .product:nth-child(2) p', 'बिना हार्डवेयर बदले BIOS admin पासवर्ड स्थायी रूप से हटाएँ।');
  text('.products .product:nth-child(3) h3', 'रिकवरी सेवा');
  text('.products .product:nth-child(3) p', 'प्रमाणित विशेषज्ञ 24 घंटे में BIOS अनलॉक करते हैं — वारंटी-सुरक्षित सेवा।');
  text('#how-it-works .section-title', 'यह कैसे काम करता है');
  text('#how-it-works .step-item:nth-child(1) span:last-child', 'Service Tag पाएँ');
  text('#how-it-works .step-item:nth-child(2) span:last-child', 'टूल खरीदें');
  text('#how-it-works .step-item:nth-child(3) span:last-child', 'Tag डालें, कोड पाएँ');
  text('#how-it-works .step-item:nth-child(4) span:last-child', 'BIOS अनलॉक करें');
  text('.buy-card h2', 'तुरंत पहुँच पाएँ');
  text('.buy-card > p:not(.selected-plan):not(.pay-note)', 'PayPal भुगतान या Telegram bot — टूल कुछ मिनटों में डिलीवर।');
  text('#selectedPlan', 'ऊपर कोई सेवा चुनें, ताकि यहाँ उसका शुल्क दिखे।');
  label('.btn-buy .buy-label', 'टूल खरीदें');
  label('.btn-telegram', 'Telegram Bot');
  label('.btn-paypal', 'PayPal — जल्द उपलब्ध');
  label('.btn-tg', '@BiosZone_bot');
  text('#payNote', 'PayPal checkout जल्द उपलब्ध होगा — वही टूल अभी Telegram bot से मिलता है।');
  text('#guides .section-title', 'संबंधित गाइड');
  text('.guides-note', 'पूरा गाइड पढ़ने के लिए प्रश्न चुनें — nexxgsm.com knowledge base से अनुवादित और अनुकूलित।');
  text('.after-guides-cta h2', 'अपने Dell को अनलॉक करने के लिए तैयार?');
  text('.after-guides-cta > p', 'स्क्रीन कोड जाँचें, सही सेवा चुनें और बिना अनुमान के निजी सहायता पाएँ।');
  text('.site-footer p:first-child', '© 2026 BIOS ZONE by NexxGSM Service Point S.R.L. · Bucharest, Romania');
  text('.site-footer .footer-note', 'Dell BIOS पासवर्ड टूल और सेवा · BIOS ZONE, NexxGSM की सेवा है — वही टीम जो nexxgsm.com knowledge base चलाती है।');

  var guideHindi = [
    '<p>अधिकांश आधुनिक Dell लैपटॉप में CMOS बैटरी निकालने से System या Admin BIOS पासवर्ड साफ़ नहीं होता। पहले स्क्रीन पर दिख रहे prompt और पूरा System Number लिखें; कुछ code के लिए model के अनुसार recovery उपलब्ध हो सकती है।</p>' +
      '<p>यह गाइड <strong>Dell System और Admin prompts</strong> के लिए है। HDD/SSD lock, BitLocker और Windows sign-in की recovery अलग होती है।</p>' +
      '<h3>पासवर्ड स्क्रीन पहचानें</h3><ul><li><strong>Windows से पहले</strong> — System / Power-on BIOS password.</li><li><strong>F2 BIOS Setup में</strong> — Admin / Setup password.</li><li><strong>HDD, SSD या Drive Password</strong> — storage lock.</li><li><strong>Windows लोड होने के बाद</strong> — Windows account password, BIOS password नहीं।</li></ul>' +
      '<h3>स्क्रीन पर code का अर्थ</h3><p>पूरा code, जैसे <strong>XXXXXXX-8FC8</strong>, ठीक वैसे ही कॉपी करें। dash के बाद के चार अक्षर recovery family पहचानने में मदद करते हैं, लेकिन पहले के अक्षर भी आवश्यक हैं। पूरा code public chat में न डालें।</p>' +
      '<h3>अगले कदम</h3><ul><li>Prompt का प्रकार तय करें।</li><li>पूरा on-screen code और suffix लिखें।</li><li>भुगतान से <em>पहले</em> जाँचें कि recovery उपलब्ध है।</li></ul>' +
      '<h3>यदि वर्तमान पासवर्ड याद है</h3><p>Power on करें, Dell logo पर <strong>F2</strong> दबाएँ, Security या Passwords खोलें, वर्तमान password डालें, नए password के दोनों field खाली छोड़कर Enter करें और save करके exit करें। exact model manual देखें।</p>' +
      '<h3>क्या recovery असंभव हो सकती है?</h3><p>हाँ। Master Password Lockout code-based recovery रोक सकता है। HDD/SSD और कुछ NVMe मामलों की अलग जाँच चाहिए।</p>' +
      '<p><a href="https://nexxgsm.com/blog/dell-bios-forgotten-password?lang=en-US" target="_blank" rel="noopener">मूल गाइड पढ़ें →</a></p>',
    '<p><strong>Service Tag</strong> support, warranty और ownership के लिए Dell का identifier है। BIOS password screen पर दिखने वाला <strong>System Number</strong> उसी device-specific screen का पूरा value है। इसे memory से न बनाएँ; स्क्रीन से पूरा कॉपी करें।</p>' +
      '<h3>पूरा value क्यों ज़रूरी है</h3><p>separator के बाद का suffix screen family पहचानने में मदद करता है, लेकिन वह password या device identifier नहीं है। कोई अक्षर, digit या separator न छोड़ें।</p>' +
      '<h3>Identifiers निजी रखें</h3><ul><li>Prompt का प्रकार System, Admin, Setup, HDD या SSD नोट करें।</li><li>System Number पूरा लिखें।</li><li>इसे forum, review या public screenshot में न डालें।</li><li>डेटा केवल private form से साझा करें।</li></ul>' +
      '<h3>आम गलतियाँ</h3><ul><li>System Number माँगे जाने पर केवल Service Tag भेजना।</li><li>केवल suffix या cropped photo भेजना।</li><li>BitLocker या Windows prompt को BIOS password समझना।</li></ul>' +
      '<p><a href="https://nexxgsm.com/blog/dell-system-number-vs-service-tag?lang=en-US" target="_blank" rel="noopener">मूल गाइड पढ़ें →</a></p>',
    '<p>यदि Windows से पहले “This computer system is protected by a password authentication system” दिखता है, तो पहले password type पहचानें। “Dell Security Manager” heading अकेले यह नहीं बताती कि startup, BIOS settings या drive में क्या locked है।</p>' +
      '<h3>स्क्रीन के शब्द मिलाएँ</h3><ul><li><strong>Enter System Password</strong> — boot रुकता है तो System BIOS path देखें।</li><li><strong>system or administrator password</strong> — पूरा text और System Number बचाएँ।</li><li><strong>Admin Password / Unlock Setup in F2</strong> — BIOS settings locked हो सकती हैं।</li><li><strong>HDD / SSD / Hard Drive Password</strong> — अलग storage case.</li><li><strong>Windows PIN या BitLocker</strong> — account recovery या BitLocker key चाहिए।</li></ul>' +
      '<h3>क्या standard Dell password है?</h3><p>सभी Dell लैपटॉप के लिए कोई universal factory password नहीं है। “Admin” password type है, उसमें शब्द “admin” डालने का संकेत नहीं। random lists आज़माने के बजाय सही prompt जाँचें।</p>' +
      '<h3>Recovery से पहले</h3><p>Second-hand laptop हो तो seller से password हटवाएँ। Managed device हो तो IT administrator से संपर्क करें। CMOS battery निकालना या Windows reinstall करना universal fix नहीं है।</p>' +
      '<p><a href="https://nexxgsm.com/blog/dell-security-manager-password?lang=en-US" target="_blank" rel="noopener">मूल गाइड पढ़ें →</a></p>',
    '<p>F2 BIOS Setup में माँगा गया Dell admin password, Windows administrator password नहीं है। Admin/Setup firmware settings बचाता है, System startup रोक सकता है और drive password अलग case है।</p>' +
      '<h3>System password</h3><p>Operating system लोड होने से पहले जाँचा जाता है और boot रोक सकता है।</p>' +
      '<h3>Admin या Setup password</h3><p>Firmware settings की रक्षा करता है। Windows फिर भी शुरू हो सकता है, पर boot order, Secure Boot या virtualization locked रह सकते हैं।</p>' +
      '<h3>Windows शुरू हो रहा है लेकिन Admin भूल गए?</h3><p>Windows reset करने की ज़रूरत नहीं। Known password हो तो model manual से बदलें। Password न याद हो तो configured करने वाले व्यक्ति से पूछें और Secure Boot, drive mode या TPM को बदलकर प्रयोग न करें।</p>' +
      '<h3>HDD या SSD password</h3><p>Storage device की रक्षा करता है, Windows sign-in या BIOS settings की नहीं। Dell के अनुसार NVMe SSD के लिए release code उपलब्ध नहीं होता।</p>' +
      '<h3>Windows और BitLocker अलग हैं</h3><p>Windows password/PIN sign-in नियंत्रित करता है। BitLocker को 48-digit recovery key चाहिए।</p>' +
      '<p><a href="https://nexxgsm.com/blog/dell-bios-password-types?lang=en-US" target="_blank" rel="noopener">मूल गाइड पढ़ें →</a></p>',
    '<p>यदि Dell password screen का code “-8FC8” पर खत्म होता है, तो 8FC8 केवल suffix है। यह पूरा code, password या recovery की गारंटी नहीं है।</p>' +
      '<h3>पूरा code कॉपी करें</h3><p>Format <strong>XXXXXXX-8FC8</strong> में dash से पहले के characters भी compatibility check के लिए चाहिए। “8FC8” अकेला पर्याप्त नहीं।</p>' +
      '<h3>8FC8 क्या बता सकता है</h3><ul><li>Password-screen format पहचानने में मदद करता है।</li><li>Owner या ownership साबित नहीं करता।</li><li>Universal Dell master password नहीं है।</li><li>Compatibility या successful recovery की गारंटी नहीं देता।</li></ul>' +
      '<h3>Recovery से पहले</h3><p>यह तय करें कि screen System at power-on है या Admin/Setup in F2। HDD, SSD या Drive Password हो तो अलग जाँच चाहिए। पूरा code कभी public न करें।</p>' +
      '<h3>Recovery कब उपलब्ध नहीं हो सकती</h3><p>Master Password Lockout enabled होने पर code-based recovery बंद हो सकती है। 8FC8 इन सीमाओं को नहीं बदलता।</p>' +
      '<p><a href="https://nexxgsm.com/blog/dell-8fc8-bios-password-code?lang=en-US" target="_blank" rel="noopener">मूल गाइड पढ़ें →</a></p>',
    '<p>“Reset my Dell laptop password” कई अलग समस्याएँ हो सकती हैं। सही path इस बात पर निर्भर है कि prompt कब दिखता है और उसमें क्या लिखा है।</p>' +
      '<h3>त्वरित जाँच</h3><ul><li><strong>Power-on के तुरंत बाद</strong> — Dell System / BIOS password.</li><li><strong>केवल F2 Setup खोलते समय</strong> — Dell Admin / Setup password.</li><li><strong>HDD, SSD या Drive Password</strong> — अलग storage lock.</li><li><strong>Windows photo, email, PIN या sign-in</strong> — Microsoft account recovery.</li><li><strong>Blue BitLocker screen</strong> — 48-digit recovery key.</li></ul>' +
      '<h3>जब यह Dell BIOS password है</h3><p>System password power-on पर जाँचा जाता है। Admin/Setup F2 settings की रक्षा करता है। Error या system code दिखे तो suffix सहित ठीक-ठीक लिखें और public न करें।</p>' +
      '<h3>जब BIOS शामिल नहीं है</h3><p>Windows PIN, Microsoft account और BitLocker की recovery Microsoft या IT से होती है। HDD/SSD password data-access का अलग मामला है।</p>' +
      '<p><a href="https://nexxgsm.com/blog/dell-laptop-password-bios-vs-windows?lang=en-US" target="_blank" rel="noopener">मूल गाइड पढ़ें →</a></p>',
    '<p>“Dell BIOS recovery” और “Dell BIOS password reset” एक ही चीज़ नहीं हैं। पहला firmware repair है; दूसरा authentication से संबंधित है।</p>' +
      '<h3>त्वरित तुलना</h3><ul><li><strong>BIOS update के बाद black screen या POST failure</strong> → BIOS Recovery.</li><li><strong>Settings को default पर लौटाना</strong> → BIOS defaults; passwords फिर भी रहते हैं।</li><li><strong>Windows से पहले password prompt</strong> → System password support.</li><li><strong>F2 settings locked</strong> → Admin / Setup support.</li><li><strong>HDD, SSD या Drive Password</strong> → अलग storage support.</li><li><strong>Windows PIN या Microsoft account</strong> → Windows recovery.</li><li><strong>Blue BitLocker screen</strong> → मालिक की 48-digit key.</li></ul>' +
      '<h3>BIOS Recovery क्या करता है</h3><p>Supported model में disk या USB से damaged firmware restore करने की कोशिश करता है। यह password-removal tool नहीं है और हर model/fault पर सफल नहीं होता।</p>' +
      '<h3>Firmware बदलने से पहले</h3><ul><li>Exact Dell model की image लें।</li><li>BitLocker key पहले खोजें।</li><li>Recovery के दौरान power न काटें।</li><li>केवल password prompt के लिए BIOS Recovery न चलाएँ।</li></ul>' +
      '<p><a href="https://nexxgsm.com/blog/dell-bios-recovery-vs-password-reset?lang=en-US" target="_blank" rel="noopener">मूल गाइड पढ़ें →</a></p>',
    '<p>कोई universal default Dell BIOS password नहीं है। Admin और System passwords device पर अलग-अलग सेट होते हैं। “Not Set” का अर्थ password assigned नहीं है।</p>' +
      '<h3>सीधा उत्तर</h3><p>Dell कोई factory या universal master password प्रकाशित नहीं करता। Password owner, previous owner, employer या IT policy ने सेट किया हो सकता है। Internet list से मिला शब्द आपके device के लिए प्रमाण नहीं है।</p>' +
      '<h3>“Default password for Latitude 5400 / 7490”?</h3><p>ऐसी searches common combination नहीं देतीं। Exact model manual देखें; Latitude, Inspiron, Vostro, XPS और Precision अलग systems हैं।</p>' +
      '<h3>Master Password Lockout recovery रोक सकता है</h3><p>कुछ business systems में यह setting सामान्य recovery बंद कर देती है। कोई service हर configuration के लिए guarantee नहीं दे सकती।</p>' +
      '<h3>Identifiers सुरक्षित रखें</h3><ul><li>Service Tag, System Number या full password photo public न करें।</li><li>Unknown reset utilities install न करें।</li><li>CMOS battery pull से modern Dell password साफ़ होने की अपेक्षा न रखें।</li></ul>' +
      '<p><a href="https://nexxgsm.com/blog/dell-bios-default-master-password?lang=en-US" target="_blank" rel="noopener">मूल गाइड पढ़ें →</a></p>'
  ];

  var summaries = [
    'Dell BIOS पासवर्ड भूल गए — वास्तव में क्या काम करता है?',
    'System Number और Service Tag — कौन-सा भेजें?',
    'Dell Security Manager बार-बार पासवर्ड माँगता है?',
    'Admin, System और HDD passwords — इनमें अंतर क्या है?',
    'Code में 8FC8 suffix का क्या अर्थ है?',
    'BIOS password या Windows password — आपको कौन रोक रहा है?',
    'BIOS Recovery और password reset — एक ही चीज़ नहीं',
    'क्या कोई default या master Dell BIOS password है?'
  ];

  document.querySelectorAll('.guide').forEach(function (guide, index) {
    var summary = guide.querySelector('summary');
    var body = guide.querySelector('.guide-body');
    if (summary && summaries[index]) entries.push({ node: summary, hindi: summaries[index] });
    if (body && guideHindi[index]) entries.push({ node: body, hindi: guideHindi[index], mode: 'html' });
  });

  var selectedTarget = document.querySelector('[data-pick-target]');
  var selectedPlan = document.getElementById('selectedPlan');
  var planEnglish = { reset: 'Reset Tool · $28.20', remove: 'Remove Tool · $17.45', recovery: 'Recovery Service · $49.99' };
  var planHindi = { reset: 'रीसेट टूल · $28.20', remove: 'रिमूव टूल · $17.45', recovery: 'रिकवरी सेवा · $49.99' };
  function refreshSelectedPlan(enabled) {
    if (!selectedTarget || !selectedPlan) return;
    var key = selectedTarget.getAttribute('data-selected');
    if (!key) return;
    selectedPlan.textContent = (enabled ? 'चयनित: ' : 'Selected: ') + (enabled ? planHindi[key] : planEnglish[key] || 'service');
  }

  function setLabel(node, value) {
    var textNodes = Array.prototype.filter.call(node.childNodes, function (child) {
      return child.nodeType === Node.TEXT_NODE;
    });
    if (textNodes.length) textNodes[textNodes.length - 1].nodeValue = '\n            ' + value + '\n          ';
    else node.appendChild(document.createTextNode(value));
  }

  function applyHindi(enabled) {
    entries.forEach(function (entry) {
      if (entry.mode === 'html') entry.node.innerHTML = enabled ? entry.hindi : entry.english;
      else if (entry.mode === 'label') setLabel(entry.node, enabled ? entry.hindi : entry.english);
      else if (entry.mode === 'ariaLabel') entry.node.setAttribute('aria-label', enabled ? entry.hindi : entry.english);
      else if (entry.mode === 'headerCta') {
        entry.node.setAttribute('aria-label', enabled ? 'अभी खरीदें' : 'Buy now');
      } else if (entry.mode === 'sectionTitle') {
        entry.node.textContent = enabled ? entry.hindi : entry.english;
      } else {
        entry.node.textContent = enabled ? entry.hindi : entry.english;
      }
    });
    root.lang = enabled ? 'hi-IN' : 'en-US';
    toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    toggle.setAttribute('aria-label', enabled ? 'Switch to English' : 'हिन्दी में बदलें');
    toggle.textContent = enabled ? 'English' : 'हिन्दी';
    document.title = enabled
      ? 'Dell BIOS पासवर्ड अनलॉक — BIOS ZONE'
      : 'Dell BIOS Password Reset Tool | Unlock Instantly | NexxGSM';
    refreshSelectedPlan(enabled);
    try { localStorage.setItem('biosunlocktool-language', enabled ? 'hi' : 'en'); } catch (_) {}
  }

  entries.forEach(function (entry) {
    entry.english = entry.mode === 'html' ? entry.node.innerHTML :
      entry.mode === 'label' ? entry.node.textContent.trim() :
      entry.mode === 'ariaLabel' ? entry.node.getAttribute('aria-label') :
      entry.node.textContent;
  });

  var initialHindi = false;
  try { initialHindi = localStorage.getItem('biosunlocktool-language') === 'hi'; } catch (_) {}
  if (selectedTarget && window.MutationObserver) {
    new MutationObserver(function () { refreshSelectedPlan(root.lang === 'hi-IN'); })
      .observe(selectedTarget, { attributes: true, attributeFilter: ['data-selected'] });
  }
  toggle.addEventListener('click', function () { applyHindi(toggle.getAttribute('aria-pressed') !== 'true'); });
  applyHindi(initialHindi);
}());
