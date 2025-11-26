// Background service worker for API calls and data processing

// Import config (you'll need to load this via storage)
let GROQ_API_KEY = '';

// Load API key from storage on startup
chrome.storage.sync.get(['groqApiKey'], function(result) {
  if (result.groqApiKey) {
    GROQ_API_KEY = result.groqApiKey;
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchPrices') {
    fetchPricesFromMultipleSites(request.productData)
      .then(prices => sendResponse({ success: true, prices }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'detectScam') {
    analyzeScamWithGroq(request.productData)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'saveApiKey') {
    GROQ_API_KEY = request.apiKey;
    chrome.storage.sync.set({ groqApiKey: request.apiKey });
    sendResponse({ success: true });
    return true;
  }
});

// Fetch prices from multiple e-commerce sites
async function fetchPricesFromMultipleSites(productData) {
  const { productName, currentPrice, site } = productData;
  const searchQuery = encodeURIComponent(productName);
  
  const prices = [];
  
  // For real deployment, use actual APIs or scraping services
  // Here's a template for different sites
  
  if (site !== 'amazon') {
    try {
      const amazonPrice = await searchAmazon(searchQuery, productName);
      if (amazonPrice) prices.push(amazonPrice);
    } catch (e) {
      console.error('Amazon fetch error:', e);
    }
  }
  
  if (site !== 'flipkart') {
    try {
      const flipkartPrice = await searchFlipkart(searchQuery, productName);
      if (flipkartPrice) prices.push(flipkartPrice);
    } catch (e) {
      console.error('Flipkart fetch error:', e);
    }
  }
  
  if (site !== 'myntra') {
    try {
      const myntraPrice = await searchMyntra(searchQuery, productName);
      if (myntraPrice) prices.push(myntraPrice);
    } catch (e) {
      console.error('Myntra fetch error:', e);
    }
  }
  
  return prices;
}

// Search Amazon (mock for now - replace with real API)
async function searchAmazon(query, productName) {
  // For production: Use Amazon Product Advertising API or RapidAPI
  // Mock data for demonstration
  await delay(300);
  return {
    site: 'Amazon',
    price: Math.floor(Math.random() * 5000) + 1000,
    url: `https://www.amazon.in/s?k=${query}`,
    available: true
  };
}

// Search Flipkart (mock for now - replace with real API)
async function searchFlipkart(query, productName) {
  await delay(400);
  return {
    site: 'Flipkart',
    price: Math.floor(Math.random() * 5000) + 1000,
    url: `https://www.flipkart.com/search?q=${query}`,
    available: true
  };
}

// Search Myntra (mock for now - replace with real API)
async function searchMyntra(query, productName) {
  await delay(350);
  return {
    site: 'Myntra',
    price: Math.floor(Math.random() * 5000) + 1000,
    url: `https://www.myntra.com/${query}`,
    available: Math.random() > 0.3
  };
}

// Analyze product for scam using Groq AI
async function analyzeScamWithGroq(productData) {
  const { 
    productName, 
    price, 
    rating, 
    reviewCount, 
    sellerName 
  } = productData;

  // If no API key, fall back to basic heuristics
  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    return analyzeScamBasic(productData);
  }

  try {
    const prompt = `Analyze this e-commerce product listing for scam indicators and respond ONLY with a JSON object (no markdown, no backticks):

Product Details:
- Name: ${productName}
- Price: ₹${price}
- Rating: ${rating}/5
- Review Count: ${reviewCount}
- Seller: ${sellerName}

Analyze for:
1. Unrealistic pricing
2. Spam/misleading keywords
3. Rating anomalies (high rating with very few reviews)
4. Suspicious seller information
5. Title quality issues

Respond with this exact JSON structure:
{
  "scamScore": <number 0-100>,
  "riskLevel": "<low|medium|high>",
  "flags": ["flag1", "flag2"],
  "recommendation": "brief recommendation text"
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are a scam detection expert. Analyze e-commerce listings and respond ONLY with valid JSON. No markdown, no code blocks, just pure JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Clean response (remove markdown if present)
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanContent);

    return result;

  } catch (error) {
    console.error('Groq API Error:', error);
    // Fallback to basic analysis
    return analyzeScamBasic(productData);
  }
}

// Basic scam detection (fallback when API is not available)
function analyzeScamBasic(productData) {
  const { productName, price, rating, reviewCount, sellerName } = productData;
  
  let scamScore = 0;
  const flags = [];
  
  // Check 1: Unrealistic pricing
  if (price < 100) {
    scamScore += 30;
    flags.push('Suspiciously low price');
  }
  
  // Check 2: Spam keywords
  const spamKeywords = ['guaranteed', 'limited offer', 'hurry', '100% original', 'best deal ever', 'free', 'bonus'];
  const titleLower = productName.toLowerCase();
  const spamCount = spamKeywords.filter(keyword => titleLower.includes(keyword)).length;
  if (spamCount > 0) {
    scamScore += spamCount * 10;
    flags.push('Contains spam keywords in title');
  }
  
  // Check 3: Rating anomalies
  if (rating && reviewCount) {
    if (rating > 4.8 && reviewCount < 10) {
      scamScore += 25;
      flags.push('High rating with very few reviews (possible fake reviews)');
    }
    if (rating < 2.5 && reviewCount > 50) {
      scamScore += 15;
      flags.push('Very low product rating with many reviews');
    }
  }
  
  // Check 4: Seller reputation
  if (sellerName && sellerName.length < 5) {
    scamScore += 10;
    flags.push('Suspicious seller name');
  }
  
  // Check 5: Title quality
  const hasExcessiveCaps = (productName.match(/[A-Z]/g) || []).length / productName.length > 0.5;
  if (hasExcessiveCaps && productName.length > 20) {
    scamScore += 15;
    flags.push('Excessive capitalization in title');
  }
  
  // Determine risk level
  let riskLevel = 'low';
  if (scamScore >= 50) riskLevel = 'high';
  else if (scamScore >= 25) riskLevel = 'medium';
  
  return {
    scamScore: Math.min(scamScore, 100),
    riskLevel,
    flags,
    recommendation: getRiskRecommendation(riskLevel)
  };
}

function getRiskRecommendation(riskLevel) {
  switch(riskLevel) {
    case 'high':
      return 'High risk detected! We strongly recommend avoiding this listing.';
    case 'medium':
      return 'Moderate risk detected. Please verify seller details and reviews carefully before purchasing.';
    default:
      return 'This listing appears legitimate based on our analysis.';
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}