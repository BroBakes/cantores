(function(){
  function renderConcert(ev, lang){
    var div = document.createElement('div');
    div.className = 'event';
    div.setAttribute('data-date', ev.date);
    div.innerHTML =
      '<div class="date"><span class="d">' + ev.day + '.<em>' + ev.month + '.</em></span></div>' +
      '<div class="prog">' +
        (function(){ var t = ev.tag[lang], p = t.split(/\s*&middot;\s*/), long = p[1] && p.slice(1).join(' ').length > 14; return '<span class="tag ' + ev.tagClass + (long ? ' two' : '') + '">' + (long ? p[0] + ' &middot;<br>' + p.slice(1).join(' &middot; ') : t) + '</span>'; })() +
        '<h3>' + ev.title[lang] + '</h3>' +
        (function(){ var d = ev.description[lang], m = d.match(/^(.*?)\s*&middot;\s*((?:u suradnji|u organizaciji|in partnership)[^]*)$/i); if (!m) return '<div class="composers">' + d + '</div>'; return '<div class="composers">' + m[1] + '</div><div class="partner" style="display:flex;align-items:center;gap:10px;margin-top:10px;font-family:var(--serif);font-style:normal;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold,#6b4e26)"><span aria-hidden="true" style="flex:0 0 18px;height:1px;background:currentColor;opacity:.6"></span><span>' + m[2] + '</span></div>'; })() +
      '</div>' +
      '<div class="loc">' +
        '<div class="place italic">' + ev.venue[lang] + '</div>' +
        (ev.addressLine ? '<div class="place italic" style="font-size:.78em;line-height:1.35;margin:4px 0 10px;opacity:.85;display:flex;gap:6px;align-items:flex-start"><svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="flex:none;margin-top:.2em"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>' + ev.addressLine + '</span></div>' : '') +
        '<div class="time"' + '' + '>' + ev.time[lang] + '</div>' +
      '</div>';
    return div;
  }

  function stripHtml(html){
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent.trim();
  }

  function injectMusicEvents(data, lang){
    var script = document.getElementById('ld-json');
    if (!script) return;
    var graph;
    try { graph = JSON.parse(script.textContent); } catch (e) { return; }
    var today = new Date(); today.setHours(0,0,0,0);
    var siteBase = 'https://cantoressanctimarci.hr';
    var pagePrefix = lang === 'en' ? siteBase + '/en' : siteBase;
    var pageUrl = lang === 'en' ? siteBase + '/en#koncerti' : siteBase + '/#koncerti';
    graph['@graph'] = graph['@graph'].filter(function(node){ return node['@type'] !== 'MusicEvent'; });
    data.forEach(function(ev){
      var d = new Date(ev.date + 'T00:00:00');
      if (d < today) return;
      var loc = { '@type': 'Place', name: stripHtml(ev.venue[lang]) };
      if (ev.address) loc.address = { '@type': 'PostalAddress', streetAddress: ev.address.streetAddress, addressLocality: ev.address.addressLocality, postalCode: ev.address.postalCode, addressCountry: ev.address.addressCountry };
      graph['@graph'].push({
        '@type': 'MusicEvent',
        '@id': pagePrefix + '/#event-' + ev.date,
        name: stripHtml(ev.title[lang]),
        description: stripHtml(ev.description[lang]),
        startDate: ev.date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: loc,
        performer: { '@id': siteBase + '/#musicgroup' },
        url: pageUrl,
        inLanguage: lang
      });
    });
    script.textContent = JSON.stringify(graph);
  }

  window.renderConcerts = function(lang){
    var list = document.getElementById('concerts-list');
    if (!list) return Promise.resolve([]);
    return fetch('content/concerts.json', {cache:'no-cache'}).then(function(r){ return r.json(); }).then(function(data){
      var today = new Date(); today.setHours(0,0,0,0);
      var prevYear = null;
      data.forEach(function(ev){
        var y = ev.date.slice(0,4);
        if (y !== prevYear) {
          var sep = document.createElement('div');
          sep.className = 'year-divider';
          sep.setAttribute('role', 'separator');
          sep.style.cssText = 'display:flex;align-items:center;gap:18px;padding:' + (prevYear ? '28px' : '0') + ' 0 8px;font-family:var(--serif);font-style:italic;font-size:clamp(22px,2.2vw,30px);color:var(--gold,#6b4e26)';
          sep.innerHTML = '<span aria-hidden="true" style="flex:0 0 40px;height:1px;background:currentColor;opacity:.5"></span><span>' + y + '.</span><span aria-hidden="true" style="flex:1;height:1px;background:currentColor;opacity:.25"></span>';
          list.appendChild(sep);
        }
        prevYear = y;
        var el = renderConcert(ev, lang);
        var d = new Date(ev.date + 'T00:00:00');
        if (d < today) el.classList.add('is-past');
        list.appendChild(el);
      });
      injectMusicEvents(data, lang);
      return data;
    });
  };
})();
