/**
 * StyleSwap Widget Embed Script
 * Include this script in your website to enable the StyleSwap try-on widget
 * 
 * Usage:
 * <script src="https://styleswap.com/widget.js"></script>
 * <script>
 *   StyleSwapWidget.init({
 *     apiKey: "sk_your_api_key",
 *     productId: "prod_123",
 *     productName: "Beautiful Dress",
 *     containerId: "styleswap-widget"
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  // Configuration
  const DEFAULT_CONFIG = {
    primaryColor: '#FF6B35',
    accentColor: '#004E89',
    containerWidth: '100%',
    position: 'inline', // 'inline' or 'modal'
  };

  // Widget initialization
  const StyleSwapWidget = {
    instances: {},
    config: {},

    /**
     * Initialize the widget
     * @param {Object} options - Configuration options
     * @param {string} options.apiKey - Your StyleSwap API key
     * @param {string} options.productId - Product ID to try on
     * @param {string} options.productName - Product name for display
     * @param {string} options.containerId - ID of container element
     * @param {string} options.primaryColor - Primary button color
     * @param {string} options.accentColor - Accent color
     * @param {Function} options.onTryOnComplete - Callback when try-on completes
     */
    init: function(options) {
      if (!options.apiKey) {
        console.error('StyleSwapWidget: apiKey is required');
        return;
      }

      if (!options.productId) {
        console.error('StyleSwapWidget: productId is required');
        return;
      }

      const containerId = options.containerId || 'styleswap-widget';
      const container = document.getElementById(containerId);

      if (!container) {
        console.error(`StyleSwapWidget: Container with id "${containerId}" not found`);
        return;
      }

      const config = Object.assign({}, DEFAULT_CONFIG, options);
      this.config[containerId] = config;
      this.instances[containerId] = this.createWidget(container, config);
    },

    /**
     * Create the widget HTML and attach event listeners
     */
    createWidget: function(container, config) {
      const widgetHTML = `
        <div class="styleswap-widget" style="width: ${config.containerWidth}; max-width: 500px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div class="styleswap-card" style="
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            background: white;
          ">
            <!-- Header -->
            <div class="styleswap-header" style="
              background: linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor});
              color: white;
              padding: 24px;
            ">
              <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
                Try On ${config.productName}
              </h3>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                See how this looks on you in seconds
              </p>
            </div>

            <!-- Content -->
            <div class="styleswap-content" style="padding: 24px;">
              <button class="styleswap-button-primary" style="
                width: 100%;
                padding: 12px 24px;
                background: ${config.primaryColor};
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s;
              ">
                Start Try-On
              </button>
              <p style="
                margin: 16px 0 0 0;
                font-size: 12px;
                color: #666;
                text-align: center;
              ">
                Upload a photo of yourself and we'll show you how this looks
              </p>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = widgetHTML;

      // Attach event listeners
      const button = container.querySelector('.styleswap-button-primary');
      button.addEventListener('click', () => {
        this.openWidget(config);
      });

      return {
        config: config,
        container: container,
      };
    },

    /**
     * Open the widget modal
     */
    openWidget: function(config) {
      // Create modal
      const modal = document.createElement('div');
      modal.className = 'styleswap-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
      `;

      // Modal header
      const header = document.createElement('div');
      header.style.cssText = `
        background: linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor});
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      header.innerHTML = `
        <h2 style="margin: 0; font-size: 18px;">Try On ${config.productName}</h2>
        <button class="styleswap-close-btn" style="
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      `;

      // Modal body
      const body = document.createElement('div');
      body.style.cssText = `
        padding: 24px;
      `;
      body.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <p style="margin: 0; color: #666;">Widget functionality coming soon</p>
          <p style="margin: 16px 0 0 0; font-size: 12px; color: #999;">
            Please use the Widget Builder to customize your widget
          </p>
        </div>
      `;

      // Assemble modal
      modalContent.appendChild(header);
      modalContent.appendChild(body);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Close button handler
      header.querySelector('.styleswap-close-btn').addEventListener('click', () => {
        modal.remove();
      });

      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    },

    /**
     * Destroy widget instance
     */
    destroy: function(containerId) {
      if (this.instances[containerId]) {
        delete this.instances[containerId];
        delete this.config[containerId];
      }
    },
  };

  // Expose to window
  window.StyleSwapWidget = StyleSwapWidget;

  // Auto-initialize if data attributes are present
  document.addEventListener('DOMContentLoaded', function() {
    const widgets = document.querySelectorAll('[data-styleswap-widget]');
    widgets.forEach(function(el) {
      const config = {
        containerId: el.id,
        apiKey: el.getAttribute('data-api-key'),
        productId: el.getAttribute('data-product-id'),
        productName: el.getAttribute('data-product-name') || 'Product',
        primaryColor: el.getAttribute('data-primary-color') || DEFAULT_CONFIG.primaryColor,
        accentColor: el.getAttribute('data-accent-color') || DEFAULT_CONFIG.accentColor,
      };
      StyleSwapWidget.init(config);
    });
  });

})(window);
