# Price Comparison Chrome Extension

A Chrome extension that helps users compare prices across different e-commerce platforms using AI-powered analysis.

## 🚀 Features

- **Real-time Price Comparison**: Compare prices across multiple online retailers
- **AI-Powered Analysis**: Uses Groq AI to provide intelligent product recommendations
- **User-Friendly Interface**: Clean and intuitive popup interface
- **Quick Access**: One-click activation from your Chrome toolbar

## 📋 Prerequisites

Before you begin, ensure you have:
- Google Chrome browser
- A Groq API key (free at [console.groq.com](https://console.groq.com/))

## 🔧 Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/Vedpatel2708/price-comparsion-extension.git
cd price-comparsion-extension
```

### Step 2: Set Up Your API Key

1. Copy the example config file:
```bash
   cp config.example.js config.js
```

2. Open `config.js` and add your Groq API key:
```javascript
   const GROQ_API_KEY = "your_actual_groq_api_key_here";
```

3. Get your free API key from [Groq Console](https://console.groq.com/)

### Step 3: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `price-comparsion-extension` folder
5. The extension icon should appear in your toolbar!

## 💡 Usage

1. Click the extension icon in your Chrome toolbar
2. Enter a product name or URL
3. Get instant price comparisons and AI recommendations
4. Make informed purchasing decisions!

## 🛠️ Tech Stack

- **JavaScript**: Core functionality
- **Chrome Extension API**: Browser integration
- **Groq AI API**: Intelligent price analysis
- **HTML/CSS**: User interface

## 📁 Project Structure
```
price-comparsion-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── config.js             # API configuration (not in repo)
├── config.example.js     # Config template
├── background.js         # Background scripts
└── icons/                # Extension icons
```

## 🔒 Security Note

**Never commit your `config.js` file with real API keys!** This file is included in `.gitignore` to protect your credentials.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Ved Patel**

- GitHub: [@Vedpatel2708](https://github.com/Vedpatel2708)

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for providing the AI API
- Chrome Extension documentation
- All contributors who help improve this project

## 📞 Support

If you have any questions or run into issues, please [open an issue](https://github.com/Vedpatel2708/price-comparsion-extension/issues) on GitHub.

---

⭐ If you find this project useful, please consider giving it a star!
