/**
 * LoanFi Widget Embed Script
 * Add this to your checkout page to enable "Pay with LoanFi"
 */
(function() {
  'use strict';

  const WIDGET_URL = 'https://loanfi.xyz/widget';

  // LoanFi namespace
  window.LoanFi = window.LoanFi || {};

  let iframe = null;
  let callbacks = {
    onSuccess: null,
    onError: null,
  };

  /**
   * Initialize the LoanFi widget
   */
  window.LoanFi.init = function(options = {}) {
    callbacks.onSuccess = options.onSuccess || function() {};
    callbacks.onError = options.onError || function() {};

    // Find the widget container
    const container = document.getElementById('loanfi-widget');
    if (!container) {
      console.error('LoanFi: Could not find #loanfi-widget element');
      return;
    }

    // Get data attributes
    const merchantId = container.getAttribute('data-merchant-id');
    const amount = container.getAttribute('data-amount');
    const token = container.getAttribute('data-token') || 'USDC';
    const recipient = container.getAttribute('data-recipient');

    if (!merchantId || !amount || !recipient) {
      console.error('LoanFi: Missing required data attributes (merchant-id, amount, recipient)');
      return;
    }

    // Build widget URL
    const params = new URLSearchParams({
      merchantId,
      amount,
      token,
      recipient,
    });

    // Create iframe
    iframe = document.createElement('iframe');
    iframe.src = `${WIDGET_URL}?${params.toString()}`;
    iframe.style.cssText = `
      width: 100%;
      max-width: 420px;
      height: 600px;
      border: none;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    `;
    iframe.allow = 'clipboard-write';

    // Clear container and append iframe
    container.innerHTML = '';
    container.appendChild(iframe);

    // Listen for messages from widget
    window.addEventListener('message', handleMessage);
  };

  /**
   * Handle messages from the widget iframe
   */
  function handleMessage(event) {
    // Verify origin in production
    // if (event.origin !== 'https://loanfi.xyz') return;

    const { type, data } = event.data || {};

    switch (type) {
      case 'LOANFI_SUCCESS':
        callbacks.onSuccess(data.txHash);
        break;
      case 'LOANFI_ERROR':
        callbacks.onError(data.error);
        break;
      case 'LOANFI_CLOSE':
        if (iframe) {
          iframe.remove();
          iframe = null;
        }
        break;
    }
  }

  /**
   * Manually close the widget
   */
  window.LoanFi.close = function() {
    if (iframe) {
      iframe.remove();
      iframe = null;
    }
    window.removeEventListener('message', handleMessage);
  };

  // Auto-initialize if container exists on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (document.getElementById('loanfi-widget')) {
        window.LoanFi.init();
      }
    });
  } else {
    if (document.getElementById('loanfi-widget')) {
      window.LoanFi.init();
    }
  }
})();
