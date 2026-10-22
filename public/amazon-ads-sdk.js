/**
 * Universal Amazon Associates Client SDK (tag=photoid03-20)
 * Central Engine Endpoint: https://akilibrain.com/api/amazon-ads
 * Eligible Portfolio Websites (6):
 *  - getnyash.com
 *  - photosplitstudio.com
 *  - is-my-internet-working.com
 *  - audiorap.com
 *  - tiketichap.com
 *  - akilibrain.com
 */
(function () {
  'use strict';

  var TAG = 'photoid03-20';
  var ENGINE_ORIGIN = 'https://akilibrain.com';

  var HOST = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
  if (HOST.indexOf('hentaivault') !== -1) {
    // Hard safety guard: never execute on excluded adult domain
    return;
  }

  function detectSiteKey() {
    var h = HOST.toLowerCase().replace(/^www\./, '');
    if (h.indexOf('getnyash') !== -1) return 'getnyash';
    if (h.indexOf('photosplitstudio') !== -1) return 'photosplitstudio';
    if (h.indexOf('is-my-internet-working') !== -1) return 'is-my-internet-working';
    if (h.indexOf('audiorap') !== -1) return 'audiorap';
    if (h.indexOf('tiketichap') !== -1) return 'tiketichap';
    return 'akilibrain';
  }

  var SITE_KEY = detectSiteKey();

  function sendTelemetry(payload) {
    try {
      var url = ENGINE_ORIGIN + '/api/amazon-ads/event';
      var body = JSON.stringify(
        Object.assign(
          {
            site: SITE_KEY,
            pageUrl: window.location.href,
          },
          payload,
        ),
      );
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (_) {}
  }

  // Record pageview beacon for website traffic vs. product click funnel
  if (typeof window !== 'undefined') {
    sendTelemetry({ type: 'pageview' });

    // Delegate click listener for all Amazon Associates (photoid03-20) links on the page
    document.addEventListener(
      'click',
      function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href*="amazon."]') : null;
        if (!a) return;
        try {
          var u = new URL(a.href);
          if (!u.searchParams.get('tag')) {
            u.searchParams.set('tag', TAG);
            a.href = u.toString();
          }
        } catch (_) {}
        sendTelemetry({
          type: 'click',
          slot: a.getAttribute('data-amz-slot') || 'organic-link',
          productId: a.getAttribute('data-amz-product-id') || undefined,
          asin: a.getAttribute('data-amz-asin') || undefined,
        });
      },
      true,
    );
  }

  window.PortfolioAmazonAds = {
    tag: TAG,
    siteKey: SITE_KEY,
    trackClick: function (productId, slot, asin) {
      sendTelemetry({ type: 'click', productId: productId, slot: slot, asin: asin });
    },
    trackImpression: function (productId, slot, asin) {
      sendTelemetry({ type: 'impression', productId: productId, slot: slot, asin: asin });
    },
    fetchProducts: function (slot, context, limit) {
      var qs =
        '?site=' +
        encodeURIComponent(SITE_KEY) +
        '&slot=' +
        encodeURIComponent(slot || 'default') +
        '&context=' +
        encodeURIComponent(context || '') +
        '&limit=' +
        encodeURIComponent(limit || 4);
      return fetch(ENGINE_ORIGIN + '/api/amazon-ads/serve' + qs)
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          return data && data.allowed ? data.products || [] : [];
        })
        .catch(function () {
          return [];
        });
    },
  };
})();
