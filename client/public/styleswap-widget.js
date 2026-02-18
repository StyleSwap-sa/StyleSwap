/**
 * StyleSwap Embeddable Widget
 * 
 * Usage:
 * <div id="styleswap-widget"></div>
 * <script>
 *   window.StyleSwapWidget = {
 *     widgetId: 'YOUR_WIDGET_ID',
 *     containerId: 'styleswap-widget',
 *     primaryColor: '#FF6B35',
 *     accentColor: '#004E89'
 *   };
 * </script>
 * <script src="https://styleswap.co.za/styleswap-widget.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  const config = window.StyleSwapWidget || {};
  const widgetId = config.widgetId;
  const containerId = config.containerId || 'styleswap-widget';
  const primaryColor = config.primaryColor || '#FF6B35';
  const accentColor = config.accentColor || '#004E89';
  const apiUrl = config.apiUrl || 'https://styleswap.co.za/api/trpc';

  // Validate configuration
  if (!widgetId) {
    console.error('StyleSwap Widget: widgetId is required');
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`StyleSwap Widget: Container with id "${containerId}" not found`);
    return;
  }

  // Create widget HTML
  const createWidgetHTML = () => {
    return `
      <div id="styleswap-widget-container" style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        max-width: 500px;
        margin: 0 auto;
      ">
        <div id="styleswap-widget-content"></div>
      </div>
    `;
  };

  // Create initial step HTML
  const createInitialStepHTML = () => {
    return `
      <div style="
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      ">
        <div style="
          background-color: ${primaryColor};
          color: white;
          padding: 20px;
        ">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Try On Now</h2>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">See how this looks on you in seconds</p>
        </div>
        <div style="padding: 24px; space-y: 16px;">
          <button id="styleswap-start-btn" style="
            width: 100%;
            height: 48px;
            background-color: ${primaryColor};
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            Start Try-On
          </button>
          <p style="
            font-size: 12px;
            color: #666;
            text-align: center;
            margin: 16px 0 0 0;
          ">
            Upload a photo of yourself and we'll show you how this looks
          </p>
        </div>
      </div>
    `;
  };

  // Widget state
  let state = {
    step: 'initial',
    selectedGarmentType: null,
    bodyImage: null,
    garmentImage: null,
    tryOnResult: null,
  };

  // Render function
  const render = () => {
    const content = document.getElementById('styleswap-widget-content');
    
    switch (state.step) {
      case 'initial':
        content.innerHTML = createInitialStepHTML();
        document.getElementById('styleswap-start-btn').addEventListener('click', () => {
          state.step = 'garment-type';
          render();
          trackEvent('widget_started');
        });
        break;
    }
  };

  // Track events
  const trackEvent = (eventName, data = {}) => {
    // Send to analytics
    fetch(`${apiUrl}/widget.trackEvent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          widgetId,
          eventName,
          data,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch(() => {
      // Silently fail if analytics endpoint is not available
    });
  };

  // Initialize widget
  container.innerHTML = createWidgetHTML();
  render();

  // Track widget impression
  trackEvent('widget_impression');
})();
