// Content script that runs on e-commerce product pages

const currentSite = detectSite();
let extensionEnabled = true;
let scamDetectionEnabled = true;

// Load settings
chrome.storage.sync.get(['extensionEnabled', 'scamDetectionEnabled'], function(result) {
  extensionEnabled = result.extensionEnabled !== false;
  scamDetectionEnabled = result.scamDetectionEnabled !== false;
});

// Listen for setting changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleExtension') {
    extensionEnabled = request.enabled;
    if (!extensionEnabled) {
      removeWidget();
    }
  }
  if (request.action === 'toggleScamDetection') {
    scamDetectionEnabled = request.enabled;
  }
});

// Detect which site we're on
function detectSite() {
  const hostname = window.location.hostname;
  if (hostname.includes('amazon')) return 'amazon';
  if (hostname.includes('flipkart')) return 'flipkart';
  if (hostname.includes('myntra')) return 'myntra';
  return null;
}

// Extract product data from the page
function extractProductData() {
  let productData = {};
  
  switch(currentSite) {
    case 'amazon':
      productData = {
        productName: document.querySelector('#productTitle')?.textContent.trim() || 
                     document.querySelector('.product-title-word-break')?.textContent.trim() || '',
        price: extractPrice(document.querySelector('.a-price-whole')?.textContent || 
                           document.querySelector('.a-price .a-offscreen')?.textContent),
        rating: parseFloat(document.querySelector('.a-icon-star .a-icon-alt')?.textContent || 
                          document.querySelector('[data-hook="rating-out-of-text"]')?.textContent) || 0,
        reviewCount: parseInt(document.querySelector('#acrCustomerReviewText')?.textContent.replace(/[^0-9]/g, '') ||
                             document.querySelector('[data-hook="total-review-count"]')?.textContent.replace(/[^0-9]/g, '')) || 0,
        sellerName: document.querySelector('#sellerProfileTriggerId')?.textContent.trim() || 
                   document.querySelector('.tabular-buybox-text[tabular-attribute-name="Sold by"] .tabular-buybox-text-message')?.textContent.trim() || 
                   'Amazon',
        images: Array.from(document.querySelectorAll('.imageThumbnail img, #altImages img')).map(img => img.src).slice(0, 5),
        site: 'amazon'
      };
      break;
      
    case 'flipkart':
      productData = {
        productName: document.querySelector('.B_NuCI, .VU-ZEz')?.textContent.trim() || 
                     document.querySelector('h1 span')?.textContent.trim() || '',
        price: extractPrice(document.querySelector('._30jeq3, ._3I9_wc')?.textContent ||
                           document.querySelector('.CxhGGd')?.textContent),
        rating: parseFloat(document.querySelector('._3LWZlK, ._2d4LTz')?.textContent || 
                          document.querySelector('.XQDdHH')?.textContent) || 0,
        reviewCount: parseInt(document.querySelector('._2_R_DZ span, .row')?.textContent.replace(/[^0-9]/g, '') ||
                             document.querySelector('._13vcmD span')?.textContent.replace(/[^0-9]/g, '')) || 0,
        sellerName: document.querySelector('._2b7aQZ, .row')?.textContent.trim() || 
                   document.querySelector('#sellerName')?.textContent.trim() || 
                   'Flipkart',
        images: Array.from(document.querySelectorAll('._2r_T1I img, ._1Nyybr img')).map(img => img.src).slice(0, 5),
        site: 'flipkart'
      };
      break;
      
    case 'myntra':
      productData = {
        productName: document.querySelector('.pdp-title, .pdp-name')?.textContent.trim() || 
                     document.querySelector('h1.pdp-name')?.textContent.trim() || '',
        price: extractPrice(document.querySelector('.pdp-price strong, .pdp-price')?.textContent ||
                           document.querySelector('.pdp-discount-container .pdp-price')?.textContent),
        rating: parseFloat(document.querySelector('.index-overallRating, .ratings-rating')?.textContent || 
                          document.querySelector('[class*="rating"]')?.textContent) || 0,
        reviewCount: parseInt(document.querySelector('.index-ratingsCount, .ratings-count')?.textContent.replace(/[^0-9]/g, '') ||
                             document.querySelector('[class*="ratingCount"]')?.textContent.replace(/[^0-9]/g, '')) || 0,
        sellerName: document.querySelector('.pdp-seller-name, .supplier-productDescriptorsSupplierPartNumber')?.textContent.trim() || 'Myntra',
        images: Array.from(document.querySelectorAll('.image-grid-image, .image-grid-imageWrap img')).map(img => img.src).slice(0, 5),
        site: 'myntra'
      };
      break;
  }
  
  return productData;
}

// Extract numeric price from text
function extractPrice(priceText) {
  if (!priceText) return 0;
  const cleaned = priceText.replace(/[^0-9.]/g, '');
  return parseInt(cleaned) || 0;
}

// Create and inject the comparison widget
function createComparisonWidget() {
  if (document.getElementById('price-comparison-widget')) return;
  
  const widget = document.createElement('div');
  widget.id = 'price-comparison-widget';
  widget.innerHTML = `
    <div class="pcw-header">
      <span class="pcw-title">💰 Price Comparison</span>
      <button class="pcw-close" id="pcw-close-btn">×</button>
    </div>
    <div class="pcw-content">
      <div class="pcw-loading">
        <div class="spinner"></div>
        <p>Analyzing product and comparing prices...</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(widget);
  
  document.getElementById('pcw-close-btn').addEventListener('click', () => {
    widget.style.display = 'none';
  });
  
  return widget;
}

// Remove widget
function removeWidget() {
  const widget = document.getElementById('price-comparison-widget');
  if (widget) widget.remove();
}

// Update widget with price comparison data
function updateWidgetWithPrices(prices, currentPrice) {
  const widget = document.getElementById('price-comparison-widget');
  if (!widget) return;
  
  const content = widget.querySelector('.pcw-content');
  
  const availablePrices = prices.filter(p => p.available && p.price > 0);
  const lowestPrice = availablePrices.length > 0 ? Math.min(...availablePrices.map(p => p.price)) : currentPrice;
  const savings = currentPrice > 0 ? currentPrice - lowestPrice : 0;
  
  content.innerHTML = `
    <div class="pcw-current-price">
      <span class="pcw-label">Current Price:</span>
      <span class="pcw-price">₹${currentPrice.toLocaleString('en-IN')}</span>
    </div>
    
    ${savings > 0 && availablePrices.length > 0 ? `
      <div class="pcw-savings">
        💡 Save up to ₹${savings.toLocaleString('en-IN')} by buying elsewhere!
      </div>
    ` : ''}
    
    <div class="pcw-prices">
      ${prices.map(p => `
        <div class="pcw-price-item ${!p.available ? 'unavailable' : ''} ${p.price === lowestPrice && p.available && p.price > 0 ? 'best-price' : ''}">
          <span class="pcw-site">${p.site}</span>
          <span class="pcw-amount">₹${p.price.toLocaleString('en-IN')}</span>
          ${p.price === lowestPrice && p.available && p.price > 0 ? '<span class="pcw-badge">Best Price</span>' : ''}
          ${p.available ? `<a href="${p.url}" target="_blank" class="pcw-link">View →</a>` : '<span class="unavailable-text">Not Available</span>'}
        </div>
      `).join('')}
    </div>
  `;
}

// Update widget with scam detection results
function updateWidgetWithScamDetection(scamData) {
  const widget = document.getElementById('price-comparison-widget');
  if (!widget) return;
  
  const content = widget.querySelector('.pcw-content');
  
  const riskColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  };
  
  const riskIcons = {
    low: '✓',
    medium: '⚠',
    high: '⛔'
  };
  
  const scamSection = `
    <div class="pcw-scam-section">
      <div class="pcw-scam-header" style="background-color: ${riskColors[scamData.riskLevel]};">
        <span class="pcw-scam-icon">${riskIcons[scamData.riskLevel]}</span>
        <span class="pcw-scam-title">${scamData.riskLevel.toUpperCase()} RISK</span>
        <span class="pcw-scam-score">${scamData.scamScore}/100</span>
      </div>
      <p class="pcw-recommendation">${scamData.recommendation}</p>
      ${scamData.flags.length > 0 ? `
        <div class="pcw-flags">
          <strong>⚠️ Red Flags Detected:</strong>
          <ul>
            ${scamData.flags.map(flag => `<li>${flag}</li>`).join('')}
          </ul>
        </div>
      ` : `
        <div class="pcw-all-clear">
          ✓ No major red flags detected
        </div>
      `}
    </div>
  `;
  
  content.innerHTML += scamSection;
}

// Initialize the extension
async function initialize() {
  if (!currentSite || !extensionEnabled) return;
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const productData = extractProductData();
  
  if (!productData.productName || !productData.price) {
    console.log('Price Comparison: Could not extract product data');
    return;
  }
  
  console.log('Price Comparison: Product detected', productData);
  
  createComparisonWidget();
  
  // Fetch prices
  chrome.runtime.sendMessage({
    action: 'fetchPrices',
    productData
  }, response => {
    if (response && response.success) {
      updateWidgetWithPrices(response.prices, productData.price);
    } else {
      console.error('Price fetch failed:', response?.error);
    }
  });
  
  // Detect scam if enabled
  if (scamDetectionEnabled) {
    chrome.runtime.sendMessage({
      action: 'detectScam',
      productData
    }, response => {
      if (response && response.success) {
        updateWidgetWithScamDetection(response.result);
      } else {
        console.error('Scam detection failed:', response?.error);
      }
    });
  }
}

// Run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Re-run on URL changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    removeWidget();
    setTimeout(initialize, 1000);
  }
}).observe(document, {subtree: true, childList: true});