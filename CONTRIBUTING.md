# Contributing to RythaGelathi

Thank you for your interest in contributing to RythaGelathi — an AI-powered climate advisory platform for Karnataka's women farmers.

## 🛠️ Development Setup

```bash
# 1. Clone & install
git clone https://github.com/your-username/Rytha_Gelathi.git
cd Rytha_Gelathi
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Run frontend dev server
python serve.py  # http://localhost:8080

# 4. Run API server
python api/server.py  # http://localhost:8000
```

## 📁 Project Structure

```
Rytha_Gelathi/
├── api/            # Flask API server
├── crew/           # CrewAI multi-agent pipeline
├── data/           # Crop dataset + soil database
├── frontend/       # HTML/CSS/JS frontend (PWA)
├── model/          # Persisted ML models (joblib)
├── public/         # Static assets (images)
├── tests/          # pytest test suite
├── tools/          # Custom AI agent tools
└── requirements.txt
```

## 🧪 Testing

```bash
pytest tests/ -v
```

## 📝 Code Style

- **Python**: PEP 8, type hints required, docstrings for public functions
- **JavaScript**: ES6+, strict mode, JSDoc comments
- **CSS**: BEM-inspired naming, CSS variables for theming
- **HTML**: Semantic elements, ARIA labels, unique IDs

## 🔀 Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`pytest tests/ -v`)
4. Commit with descriptive messages
5. Push and create a Pull Request

## 📜 License

This project is built for the WitchHunt 2026 hackathon under the Climate Action track.
