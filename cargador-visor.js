(() => {
  'use strict';
  const script = document.currentScript;
  const host = document.createElement('div');
  script.before(host);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeJson = value => JSON.stringify(value).replace(/</g, '\u003c');
  async function start() {
    const inlineId = script.getAttribute('data-inline');
    let config;
    if (inlineId) {
      const element = document.getElementById(inlineId);
      if (!element) throw Error('No se encuentra el JSON integrado.');
      config = JSON.parse(element.textContent);
    } else {
      const source = script.getAttribute('data-visor');
      if (!source) throw Error('Falta data-visor con la URL del JSON.');
      const response = await fetch(new URL(source, document.baseURI));
      if (!response.ok) throw Error('No se pudo cargar el JSON: HTTP ' + response.status);
      config = await response.json();
    }
    if (config.formato !== 'visor-three-json' || config.version !== 1 ||
        !config.modelo?.url || !config.importmap?.imports ||
        !['html','css','javascript'].every(key => typeof config[key] === 'string')) {
      throw Error('El archivo no tiene el formato de visor esperado.');
    }
    const frame = document.createElement('iframe');
    frame.title = config.titulo;
    frame.setAttribute('allow', 'fullscreen');
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frame.style.cssText = 'display:block;width:100%;max-width:440px;height:760px;border:0;margin:0 auto;';
    frame.style.height = script.getAttribute('data-alto') || '760px';
    const code = 'const VIEWER_CONFIG = ' + safeJson({modelo:config.modelo}) + ';\n' + config.javascript;
    frame.srcdoc = '<!DOCTYPE html><html lang="' + escapeHtml(config.idioma || 'es') + '"><head>' +
      '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + escapeHtml(config.titulo) + '</title><style>' + config.css + '</style>' +
      '<script type="importmap">' + safeJson(config.importmap) + '<' + '/script></head><body>' +
      config.html + '<script type="module">' + code.replace(/<\/script/gi, '<\\/script') + '<' + '/script></body></html>';
    host.replaceChildren(frame);
  }
  start().catch(error => { host.textContent = 'No se pudo abrir el visor: ' + error.message; console.error(error); });
})();
