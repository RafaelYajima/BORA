self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = {};
  }
  const titulo = dados.title || "BORA! Lembrete de encontro";
  const corpo = dados.body || "Seu encontro começa em breve. Confira o cronograma!";
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      tag: "bora-lembrete",
      data: { url: dados.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      const existente = janelas.find((janela) => janela.url.endsWith(destino) && "focus" in janela);
      if (existente) return existente.focus();
      return clients.openWindow(destino);
    }),
  );
});
