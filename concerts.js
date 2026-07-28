(function(){
  function renderConcert(ev, lang){
    var div = document.createElement('div');
    div.className = 'event';
    div.setAttribute('data-date', ev.date);
    div.innerHTML =
      '<div class="date"><span class="d">' + ev.day + '.<em>' + ev.month + '.</em></span></div>' +
      '<div class="prog">' +
        '<span class="tag ' + ev.tagClass + '">' + ev.tag[lang] + '</span>' +
        '<h3>' + ev.title[lang] + '</h3>' +
        '<div class="composers">' + ev.description[lang] + '</div>' +
      '</div>' +
      '<div class="loc">' +
        '<div class="place italic">' + ev.venue[lang] + '</div>' +
        '<div class="time">' + ev.time[lang] + '</div>' +
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
    var pageUrl = lang === 'en' ? siteBase + '/en.html#koncerti' : siteBase + '/#koncerti';
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
    return fetch('content/concerts.json').then(function(r){ return r.json(); }).then(function(data){
      var today = new Date(); today.setHours(0,0,0,0);
      data.forEach(function(ev){
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
