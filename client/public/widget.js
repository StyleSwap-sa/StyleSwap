/**
 * StyleSwap Widget - Functional Try-On Widget
 * Embed virtual try-on functionality into any website
 */

(function(window) {
  'use strict';

  const DEFAULT_CONFIG = {
    primaryColor: '#FF6B35',
    accentColor: '#004E89',
    containerWidth: '100%',
  };

  const StyleSwapWidget = {
    instances: {},
    config: {},

    init: function(options) {
      if (!options.apiKey) {
        console.error('StyleSwapWidget: apiKey is required');
        return;
      }

      const containerId = options.containerId || 'styleswap-widget';
      const container = document.getElementById(containerId);

      if (!container) {
        console.error('StyleSwapWidget: Container with id "' + containerId + '" not found');
        return;
      }

      const config = Object.assign({}, DEFAULT_CONFIG, options);
      this.config[containerId] = config;
      this.instances[containerId] = this.createWidget(container, config);
    },

    createWidget: function(container, config) {
      const widgetHTML = '<div class="styleswap-widget" style="width: ' + config.containerWidth + '; max-width: 500px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">' +
        '<div class="styleswap-card" style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; background: white;">' +
        '<div class="styleswap-header" style="background: linear-gradient(135deg, ' + config.primaryColor + ', ' + config.accentColor + '); color: white; padding: 24px;">' +
        '<h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">Try On ' + (config.productName || 'Product') + '</h3>' +
        '<p style="margin: 0; font-size: 14px; opacity: 0.9;">See how this looks on you in seconds</p>' +
        '</div>' +
        '<div class="styleswap-content" style="padding: 24px;">' +
        '<button class="styleswap-button-primary" style="width: 100%; padding: 12px 24px; background: ' + config.primaryColor + '; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">Start Try-On</button>' +
        '<p style="margin: 16px 0 0 0; font-size: 12px; color: #666; text-align: center;">Upload a photo and see how this looks</p>' +
        '</div>' +
        '</div>' +
        '</div>';

      container.innerHTML = widgetHTML;

      const button = container.querySelector('.styleswap-button-primary');
      const self = this;
      button.addEventListener('click', function() {
        self.openWidget(config);
      });

      return { config: config, container: container };
    },

    openWidget: function(config) {
      const modal = document.createElement('div');
      modal.className = 'styleswap-modal';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;';

      const modalContent = document.createElement('div');
      modalContent.style.cssText = 'background: white; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);';

      const header = document.createElement('div');
      header.style.cssText = 'background: linear-gradient(135deg, ' + config.primaryColor + ', ' + config.accentColor + '); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;';
      header.innerHTML = '<h2 style="margin: 0; font-size: 18px;">Try On ' + (config.productName || 'Product') + '</h2><button class="styleswap-close-btn" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;">×</button>';

      const body = document.createElement('div');
      body.style.cssText = 'padding: 24px;';
      body.innerHTML = '<form id="styleswap-form" style="display: flex; flex-direction: column; gap: 16px;">' +
        '<div>' +
        '<label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333;">Your Photo</label>' +
        '<input type="file" id="styleswap-user-image" accept="image/*" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" />' +
        '<p style="font-size: 12px; color: #999; margin-top: 4px;">JPG or PNG, max 5MB</p>' +
        '</div>' +
        '<div>' +
        '<label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333;">Garment Image</label>' +
        '<input type="file" id="styleswap-garment-image" accept="image/*" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" />' +
        '<p style="font-size: 12px; color: #999; margin-top: 4px;">JPG or PNG, max 5MB</p>' +
        '</div>' +
        '<div id="styleswap-error" style="display: none; padding: 12px; background: #fee2e2; color: #991b1b; border-radius: 6px; font-size: 14px;"></div>' +
        '<button type="submit" style="padding: 12px; background: ' + config.primaryColor + '; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;" id="styleswap-submit-btn">Generate Try-On</button>' +
        '</form>' +
        '<div id="styleswap-preview" style="margin-top: 20px; text-align: center; display: none;">' +
        '<img id="styleswap-result-img" style="max-width: 100%; max-height: 400px; border-radius: 8px;" />' +
        '</div>';

      const form = body.querySelector('#styleswap-form');
      const self = this;

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        self.handleFormSubmit(body, config);
      });

      modalContent.appendChild(header);
      modalContent.appendChild(body);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      header.querySelector('.styleswap-close-btn').addEventListener('click', function() {
        modal.remove();
      });

      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.remove();
        }
      });
    },

    handleFormSubmit: function(body, config) {
      const userImageInput = body.querySelector('#styleswap-user-image');
      const garmentImageInput = body.querySelector('#styleswap-garment-image');
      const submitBtn = body.querySelector('#styleswap-submit-btn');
      const errorDiv = body.querySelector('#styleswap-error');
      const preview = body.querySelector('#styleswap-preview');

      if (!userImageInput.files[0] || !garmentImageInput.files[0]) {
        errorDiv.textContent = 'Please select both images';
        errorDiv.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
      errorDiv.style.display = 'none';

      const self = this;

      Promise.all([
        this.fileToBase64(userImageInput.files[0]),
        this.fileToBase64(garmentImageInput.files[0])
      ]).then(function(results) {
        const userImageBase64 = results[0];
        const garmentImageBase64 = results[1];

        return fetch('/api/trpc?batch=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify([{
            0: {
              jsonrpc: '2.0',
              method: 'mutation',
              params: {
                path: 'protectedApi.generateTryOn',
                input: {
                  apiKey: config.apiKey,
                  productId: config.productId,
                  productName: config.productName,
                  userImage: userImageBase64,
                  garmentImage: garmentImageBase64,
                },
              },
            },
          }]),
        }).then(function(response) {
          return response.json();
        }).then(function(data) {
          if (Array.isArray(data) && data[0]) {
            const result = data[0];
            if (result.result && result.result.data && result.result.data.imageUrl) {
              preview.style.display = 'block';
              preview.querySelector('#styleswap-result-img').src = result.result.data.imageUrl;
              if (config.onTryOnComplete) {
                config.onTryOnComplete(result.result);
              }
            } else {
              throw new Error(result.error ? result.error.message : 'Failed to generate try-on');
            }
          } else {
            throw new Error('Invalid response format from server');
          }
        });
      }).catch(function(error) {
        errorDiv.textContent = error.message || 'An error occurred';
        errorDiv.style.display = 'block';
      }).finally(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Try-On';
      });
    },

    fileToBase64: function(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function() {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    destroy: function(containerId) {
      if (this.instances[containerId]) {
        delete this.instances[containerId];
        delete this.config[containerId];
      }
    },
  };

  window.StyleSwapWidget = StyleSwapWidget;

})(window);
