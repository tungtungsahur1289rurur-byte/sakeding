/* Service worker kalkulator notifikasi */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function hitung(s) {
  var t = String(s).replace(/[x×]/gi, '*').replace(/[÷:]/g, '/').replace(/,/g, '.').replace(/%/g, '/100').replace(/\s+/g, '');
  if (!t || !/^[0-9+\-*/.()]+$/.test(t)) return null;
  t = t.replace(/[+\-*/.]+$/, '');
  if (!t) return null;
  try {
    var v = Function('"use strict";return (' + t + ')')();
    if (typeof v !== 'number' || !isFinite(v)) return null;
    return Math.round(v * 1e10) / 1e10;
  } catch (e) { return null; }
}

function tampil(body, last) {
  return self.registration.showNotification('Kalkulator', {
    body: body,
    tag: 'kalkulator',
    renotify: false,
    requireInteraction: true,
    data: { last: last },
    actions: [{ action: 'hitung', type: 'text', title: 'Hitung', placeholder: 'Contoh: 12+5*3' }]
  });
}

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'tampil') {
    e.waitUntil(tampil('Ketuk "Hitung", lalu ketik hitunganmu.', null));
  }
});

self.addEventListener('notificationclick', function (e) {
  var n = e.notification;
  var last = n.data ? n.data.last : null;
  if (e.action === 'hitung' && typeof e.reply === 'string' && e.reply.trim()) {
    var input = e.reply.trim();
    if (/^[+\-*/x×÷:%]/i.test(input) && last !== null && last !== undefined) input = last + input;
    var hasil = hitung(input);
    e.waitUntil(
      hasil === null
        ? tampil('Hitungan tidak valid. Coba lagi, contoh: 12+5*3', last)
        : tampil(input + ' = ' + String(hasil).replace('.', ','), hasil)
    );
    return;
  }
  /* Browser tanpa kolom balasan, atau notifikasi diketuk biasa: buka kalkulator di web */
  n.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
      return self.clients.openWindow('./');
    })
  );
});
