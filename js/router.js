// ================================
// Router minimal basé sur Navigation API
// + View Transitions (optionnel)
// ================================

// Table de routes -> pour chaque chemin, on sait quel module ES charger.
// Chaque module exporte une fonction: export function render() { ... }
const routes = {
  '/settings': () => import('./views/settings/settings.view.js'),
  '/':         () => import('./views/homepage/homepage.view.js'), // fallback racine
};

export async function renderURL(urlString) {
  try {
    // Convertit la string en URL pour extraire le pathname
    const url = new URL(urlString, location.origin);
    const path = url.pathname;

    // Sélectionne et charge le module de page (import dynamique)
    const loadPageModule = routes[path] || routes['/'];
    const pageModule = await loadPageModule();

    // Le module de page se charge de récupérer les éléments et de les hydrater
    const applyDOMUpdates = () => {
      try {
        pageModule.render(); // peut throw (innerHTML d’une variable undef, etc.)
      } catch (err) {
        console.error('[render() error]', err);
        throw err; // IMPORTANT: rethrow pour remonter l’échec au handler
      }
    }

    // Si View Transitions est dispo, on anime le diff ; sinon, on applique directement
    if (document.startViewTransition) {
      const vt = document.startViewTransition(applyDOMUpdates);
      /* await */ vt.finished; // si tu veux enchaîner; sinon omets l'await
    } else {
      applyDOMUpdates();
    }
  } catch (err) {
    console.error('[renderURL error]', err);
    throw err; // on relance pour que l’appelant sache que ça a échoué
  }
}

// Interception centralisée des navigations "same-document" (SPA)
navigation.addEventListener('navigate', (navEvent) => {
  if (!navEvent.canIntercept) return;      // téléchargements, cross-origin…
  if (navEvent.hashChange) return;         // laisse #ancre au natif si tu veux
  if (navEvent.downloadRequest) return;    // on ne touche pas aux downloads

  navEvent.intercept({
    handler: () => renderURL(navEvent.destination.url),
  });
});

window.addEventListener('error', (ev) => {
  console.error('[global error]', ev.error || ev.message, ev);
});
window.addEventListener('unhandledrejection', (ev) => {
  console.error('[unhandled rejection]', ev.reason);
});

// ================================
// Notes :
// - Back/forward restent natifs (historique géré par Navigation API).
// - Navigation programmée: navigation.navigate('/about').
// - Tu peux limiter les transitions à des zones via CSS (view-transition-name).
// ================================