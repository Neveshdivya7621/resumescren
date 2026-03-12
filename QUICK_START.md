# SmartHire AI - Quick Reference & Quick Start Guide

---

## 📋 Quick Start (5 Minutes)

### Prerequisites
- Python 3.12+
- Node.js 24.13+
- npm 11.6+

### 1. Install & Start Backend
```bash
# Navigate to project
cd SmartHire-AI

# Create & activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r backend/requirements.txt

# Start backend
python backend/app.py
# Output: Running on http://127.0.0.1:5000
```

### 2. Install & Start Frontend
```bash
# In new terminal
cd SmartHire-AI/frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Output: ➜ Local: http://localhost:3000
```

### 3. Open in Browser
```
http://localhost:3000
```

---

## 🎯 How to Use

### Step-by-Step

**1. Paste Job Description**
- Enter full job description in first field
- Include required skills, qualifications, responsibilities
- Minimum 20 characters

**2. Upload Resumes**
- Drag and drop PDF files into upload area, OR
- Click to browse and select multiple files
- Max: 20 files, 10MB each

**3. Click "Screen Candidates"**
- System analyzes resumes
- Shows loading spinner while processing

**4. Review Results**
- Table shows ranked candidates (highest score first)
- See: Rank, Name, Score %, Quality Badge
- 🥇 🥈 🥉 medals for top 3

**5. Click for Details**
- Click any resume row to expand
- See detailed feedback:
  - ✅ **Matched Skills** (present, green badges)
  - ❌ **Missing Skills** (gaps, amber badges)
  - 📊 **Overall Assessment** (why good/bad)
  - 💡 **Recommendations** (how to improve)

**6. Make Decisions**
- Use feedback to make hiring decisions
- Consider recommendations for feedback to candidates

---

## 🏗️ Project Structure

```
SmartHire-AI/
├── PROJECT_REPORT.md          ← Read this first (complete overview)
├── TECHNICAL_GUIDE.md         ← Implementation details
├── FEEDBACK_FEATURE_GUIDE.md  ← Detailed feedback system docs
├── QUICK_START.md             ← This file
│
├── backend/                   ← Python Flask REST API
│   ├── app.py                 ← Main application (380+ lines)
│   ├── requirements.txt        ← Python dependencies
│   └── Dockerfile            ← Container configuration
│
├── frontend/                  ← React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx           ← Main React component (850+ lines)
│   │   ├── index.css         ← Tailwind CSS
│   │   └── main.jsx          ← Entry point
│   ├── package.json          ← npm dependencies
│   ├── vite.config.js        ← Vite build config
│   ├── tailwind.config.js    ← Tailwind customization
│   └── postcss.config.js     ← Post-CSS config
│
├── .github/
│   └── workflows/            ← CI/CD pipelines
│
└── README.md                 ← Original project docs
```

---

## 🔧 API Reference

### Endpoint: POST /api/screen

**URL:** `http://localhost:5000/api/screen`

**Request:**
```bash
curl -X POST http://localhost:5000/api/screen \
  -F "job_description=Seeking Python developer with Django and React skills..." \
  -F "resumes=@resume1.pdf" \
  -F "resumes=@resume2.pdf"
```

**Response (200):**
```json
{
  "results": [
    {
      "rank": 1,
      "name": "john_doe.pdf",
      "score": 87.34,
      "feedback": {
        "matched_keywords": ["python", "django", "react"],
        "missing_keywords": ["kubernetes"],
        "matched_count": 3,
        "missing_count": 1,
        "overall_assessment": "This resume is highly relevant...",
        "match_quality": "Excellent Match",
        "recommendations": ["Add experience with...", "Focus on..."]
      }
    }
  ],
  "total_screened": 1
}
```

**Error Response (400):**
```json
{
  "error": "job_description is required"
}
```

---

## 🧠 Core Concepts Explained Simply

### TF-IDF (Term Frequency-Inverse Document Frequency)
```
What: A mathematical formula to find important words
How: Scores words higher if:
  - They appear often in a document (TF)
  - They rarely appear in other documents (IDF)
Why: Finds meaningful words, ignores common filler words ("the", "a")
Example: "Python" scores high (valuable), "and" scores low (common)
```

### Cosine Similarity
```
What: Measures how similar two documents are
How: Represents documents as vectors in space, measures angle
Why: Fast, efficient, works well with text
Result: 0 (completely different) to 1 (identical) → % scale
Example: Similar resumes get higher scores
```

### Score Quality Tiers
```
75-100%: Excellent Match   → Strong fit, hire consideration
60-75%:  Good Match        → Good fit, needs some skills
40-60%:  Fair Match        → Potential, significant gaps
0-40%:   Poor Match        → Not a fit, needs retraining
```

### Keyword Extraction
```
What: Find important technical skills
How: Match against 50+ known skills database
Why: Identify gaps and matches quickly
Example: "Python, Django, Docker" extracted from resume text
```

---

## 📊 Example Outputs

### Example 1: Strong Candidate
```
Score: 87.34%
Quality: Excellent Match

Matched Skills (6): python, react, docker, aws, ci/cd, git
Missing Skills (2): kubernetes, microservices

Assessment: "This resume is highly relevant to the job description..."
Recommendations:
  → Add experience with: kubernetes, microservices
  → Strong resume! Focus on quantifying achievements
```

### Example 2: Mid-Level Candidate
```
Score: 65.42%
Quality: Good Match

Matched Skills (4): python, flask, sql, git
Missing Skills (4): django, react, docker, aws

Assessment: "This resume shows good fit with some gaps..."
Recommendations:
  → Add experience with: django, react, docker, aws
  → Highlight projects demonstrating relevant skills
  → Use industry-specific terminology in resume
```

### Example 3: Junior Candidate
```
Score: 38.15%
Quality: Poor Match

Matched Skills (2): python, sql
Missing Skills (6): django, react, docker, aws, kubernetes, ci/cd

Assessment: "This resume has limited alignment..."
Recommendations:
  → Major skill gaps in required technologies
  → Consider online courses/certifications
  → Look for entry-level roles first
```

---

## 🐛 Troubleshooting

### Issue: Backend won't start
```
Error: ModuleNotFoundError: No module named 'flask'

Solution:
1. Activate virtual environment: .venv\Scripts\activate
2. Install dependencies: pip install -r backend/requirements.txt
3. Retry: python backend/app.py
```

### Issue: Frontend shows blank page
```
Error: Cannot reach backend on port 5000

Solution:
1. Check backend is running: curl http://localhost:5000/api/health
2. Verify port 5000 is not blocked
3. Check backend console for errors
4. Refresh browser (Ctrl+R or Cmd+R)
```

### Issue: PDF extraction fails
```
Error: No extractable text found

Solution:
1. Verify PDF is not scanned/image-only
2. Try opening PDF in Adobe Reader
3. Convert to searchable PDF using online tool
4. Ensure PDF is not corrupted
```

### Issue: Slow processing with many resumes
```
Solution:
1. Process 20-30 resumes at a time (current batch size)
2. For 100+ resumes, use pending optimizations
3. Consider upgrading system RAM for large batches
```

---

## 📚 Documentation Files

| File | Purpose | Read When |
|------|---------|-----------|
| PROJECT_REPORT.md | Complete overview, concepts, architecture | First - understand big picture |
| TECHNICAL_GUIDE.md | Implementation deep-dive, code examples | Want to modify/extend code |
| FEEDBACK_FEATURE_GUIDE.md | Detailed feedback/recommendation docs | Want to understand new feature |
| QUICK_START.md | This file - quick reference | Need quick answers |

---

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t smarthire-ai .

# Run container
docker run -p 5000:5000 -p 3000:3000 smarthire-ai
```

### Production Servers
```bash
# Gunicorn (production WSGI)
gunicorn --workers 4 --bind 0.0.0.0:5000 backend.app:app

# Nginx (reverse proxy)
# [Configure nginx to forward requests]
```

### Cloud Platforms
- **AWS**: Elastic Beanstalk
- **GCP**: Cloud Run
- **Azure**: App Service
- **Heroku**: Git push deploy

---

## 🎓 Learning Resources

### Understand NLP
- TF-IDF explanation: https://en.wikipedia.org/wiki/Tf%E2%80%93idf
- Cosine Similarity: https://en.wikipedia.org/wiki/Cosine_similarity
- scikit-learn docs: https://scikit-learn.org/

### Frontend Skills
- React hooks: https://react.dev/reference/react/hooks
- Tailwind CSS: https://tailwindcss.com/docs
- Vite guide: https://vitejs.dev/guide/

### Backend Skills
- Flask basics: https://flask.palletsprojects.com/
- REST API design: https://restfulapi.net/
- Python async: https://docs.python.org/3/library/asyncio.html

---

## 💡 Tips & Best Practices

### For Best Results

**Job Description Tips:**
- Include specific skills (Python, Docker, etc.)
- Mention technologies and frameworks
- Be detailed and comprehensive
- 200+ words recommended

**Resume Tips:**
- Use standard PDF format
- Include technical skills section
- Mention specific technologies used
- Quantify achievements with metrics

**Hiring Tips:**
- Don't rely solely on score
- Review top 3-5 candidates' feedback
- Check recommended skills gaps
- Schedule interviews for borderline candidates
- Use feedback to improve job postings

### Performance Optimization

**For Fast Results:**
- Use 10-20 resumes at once (optimal)
- Ensure PDFs under 5MB
- Clear browser cache
- Use modern browser (Chrome, Firefox)

**For Server Load:**
- Process in batches
- Cache job descriptions
- Use CDN for frontend
- Monitor backend logs

---

## 🔐 Security Notes

**Production Considerations:**
1. **CORS**: Restrict to your domain
2. **Authentication**: Add API key requirement
3. **Rate Limiting**: Prevent abuse (10 req/min)
4. **HTTPS**: Always use in production
5. **Data Privacy**: Don't store resumes
6. **Input Validation**: Already implemented

**Current Setup (Development):**
- CORS: Allows all origins
- No authentication required
- No rate limiting
- HTTP only (localhost)

---

## 📞 Support & Troubleshooting

### Common Issues Checklist

- [ ] Python 3.12+ installed? `python --version`
- [ ] Node.js 24+ installed? `node --version`
- [ ] Virtual environment activated? `.venv\Scripts\activate`
- [ ] Dependencies installed? `pip list | grep flask`
- [ ] Backend running? `curl http://localhost:5000/api/health`
- [ ] Frontend running? Can you see http://localhost:3000?
- [ ] Firewall blocking ports? Check inbound rules
- [ ] Using correct Python path? `which python`
- [ ] PDF is searchable text? Not scanned image?
- [ ] Job description min 20 chars? Check length

### Debug Mode

**Backend:**
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```javascript
// React DevTools browser extension
// Check console for errors (F12)
// Check Network tab for API calls
```

---

## 🎉 Next Steps

1. ✅ **Run the application** (follow quick start above)
2. 📖 **Read PROJECT_REPORT.md** (understand concepts)
3. 🧪 **Test with sample data** (try different job descriptions)
4. 🔍 **Review TECHNICAL_GUIDE.md** (understand code)
5. 🚀 **Deploy to production** (use Docker/Cloud)
6. 📊 **Iterate & improve** (add features from roadmap)

---

## 📋 Feature Checklist

**Current Features (✅ Implemented):**
- ✅ PDF resume extraction
- ✅ TF-IDF vectorization
- ✅ Cosine similarity matching
- ✅ Ranking by relevance
- ✅ **NEW: Detailed feedback system**
- ✅ **NEW: Matched skills display**
- ✅ **NEW: Missing skills identification**
- ✅ **NEW: Smart recommendations**
- ✅ Responsive UI
- ✅ Error handling
- ✅ CORS support

**Planned Features:**
- ❌ User authentication
- ❌ Result storage/database
- ❌ Candidate profiles
- ❌ Email notifications
- ❌ Advanced filtering
- ❌ Bulk operations
- ❌ Analytics dashboard

---

## 📝 Version

**SmartHire AI v1.1**
- Base version: Cloud-native resume screener
- v1.1 Addition: Detailed feedback & recommendation system

**Last Updated:** March 2026

---

**Happy recruiting! 🚀**

