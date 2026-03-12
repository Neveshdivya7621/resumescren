# SmartHire AI - Technical Implementation Guide
## Deep Dive into Code Implementation & Architecture

---

## Table of Contents
1. [Backend Architecture](#backend-architecture)
2. [NLP Pipeline Implementation](#nlp-pipeline-implementation)
3. [Frontend Component Architecture](#frontend-component-architecture)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Code Examples](#code-examples)
6. [Testing & Debugging](#testing--debugging)
7. [Performance Optimization](#performance-optimization)

---

## Backend Architecture

### Project Structure
```
backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
└── Dockerfile            # Container configuration
```

### Core Modules Import
```python
import os                  # Environment variables
import io                  # BytesIO for in-memory streams
import logging             # Application logging
import re                  # Regular expressions for keyword extraction
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz                # PyMuPDF for PDF processing
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
```

### Application Initialization
```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### Request/Response Cycle

```
Request Phase:
1. Browser sends POST /api/screen as FormData
2. Flask receives multipart/form-data
3. request.form.get('job_description') -> string
4. request.files.getlist('resumes') -> file objects

Processing Phase:
1. Validate inputs
2. Extract PDF text
3. Vectorize using TF-IDF
4. Compute similarities
5. Generate feedback
6. Sort results by score

Response Phase:
1. jsonify() converts dict to JSON
2. Returns 200 with results
3. Browser receives and parses
4. React updates state
5. UI re-renders with results
```

---

## NLP Pipeline Implementation

### Phase 1: PDF Text Extraction

**PyMuPDF (fitz) Process:**

```python
def extract_text_from_pdf(file_bytes: bytes) -> str:
    # Step 1: Create in-memory file stream
    pdf_stream = io.BytesIO(file_bytes)
    
    # Step 2: Open PDF document
    doc = fitz.open(stream=pdf_stream, filetype="pdf")
    
    # Step 3: Iterate pages
    text_parts = []
    for page_index in range(len(doc)):
        page = doc.load_page(page_index)
        
        # Step 4: Extract text from page
        page_text = page.get_text("text")
        
        if page_text:
            text_parts.append(page_text.strip())
    
    # Step 5: Close document
    doc.close()
    
    # Step 6: Combine pages
    full_text = "\n".join(text_parts).strip()
    return full_text
```

**Why in-memory processing?**
- No temporary files on disk
- Faster I/O operations
- Better security (no residual data)
- Stateless design (cloud-friendly)

**Error Handling:**
```python
try:
    # PDF extraction
except fitz.EmptyFileError:
    # Handle empty/corrupted PDFs
    logger.warning("Empty PDF received")
    raise ValueError("PDF is empty or corrupted")
except Exception:
    # Generic handling
    logger.error("Failed to parse PDF")
    raise ValueError("Unable to parse PDF file")
```

### Phase 2: Keyword Extraction

**Skill Dictionary (50+ Skills):**
```python
common_skills = {
    # Languages
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
    
    # Frameworks
    'react', 'angular', 'vue', 'django', 'flask', 'fastapi',
    
    # Databases
    'sql', 'nosql', 'mongodb', 'postgres', 'mysql', 'redis',
    
    # DevOps
    'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd',
    
    # ML/AI
    'ml', 'ai', 'nlp', 'tensorflow', 'pytorch', 'scikit-learn',
    
    # Soft Skills
    'communication', 'leadership', 'teamwork', 'problem-solving'
}
```

**Extraction Algorithm:**
```python
def extract_keywords(text: str, top_n: int = 20) -> list[str]:
    # Step 1: Convert to lowercase
    text_lower = text.lower()
    
    # Step 2: Find all words (including special chars for C++, C#)
    words = re.findall(r'\b[a-zA-Z\+\#\-\.]+\b', text_lower)
    
    # Step 3: Match against skill dictionary
    found_keywords = []
    for word in words:
        word_clean = word.strip('.,;:!?')
        if word_clean in common_skills:
            if word_clean not in found_keywords:
                found_keywords.append(word_clean)
    
    # Step 4: Extract capitalized words (company/technology names)
    capitalized = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
    for cap_word in capitalized[:10]:
        if len(cap_word) > 3:
            found_keywords.append(cap_word.lower())
    
    # Step 5: Return top N
    return found_keywords[:top_n]
```

**Example:**
```
Input: "Seeking Python developer with React, Docker, and AWS experience"
Output: ['python', 'react', 'docker', 'aws']
```

### Phase 3: TF-IDF Vectorization

**Vectorizer Configuration Explained:**

```python
vectorizer = TfidfVectorizer(
    stop_words="english",
    # Removes: ['the', 'a', 'an', 'and', 'is', 'was', ...]
    # These are common but not meaningful
    
    ngram_range=(1, 2),
    # (1, 1) = only single words: ['python', 'django']
    # (1, 2) = words + pairs: ['python', 'django', 'python django']
    # Bigrams capture phrases better
    
    max_features=10_000,
    # Limits vocabulary to top 10,000 most common terms
    # Reduces computation and memory
    # Removes very rare/misspelled words
    
    sublinear_tf=True,
    # Uses log(tf) instead of raw tf
    # Reduces impact of very frequent terms
    # Formula: 1 + log(count) instead of count
)
```

**Vectorization Process:**

```python
# Step 1: Create corpus
corpus = [job_description] + [r["text"] for r in resumes]
# Example for 3 resumes: [JD, Resume1, Resume2, Resume3]

# Step 2: Fit and transform
tfidf_matrix = vectorizer.fit_transform(corpus)
# Output: sparse matrix of shape (4, vocab_size)
# where vocab_size is number of unique terms

# Example output shape: (4, 8742) = 4 documents, 8742 unique terms

# Step 3: Extract vectors
jd_vector = tfidf_matrix[0:1]        # Shape: (1, 8742)
resume_vectors = tfidf_matrix[1:]    # Shape: (3, 8742)
```

**What TF-IDF Scores Mean:**

```
Document: "I am a Python developer with Django experience"

Term        | TF   | IDF  | TF-IDF | Meaning
------------|------|------|--------|------------------
the         | 0.25 | 0.5  | 0.125  | Very common, low value
python      | 0.125| 2.5  | 0.3125 | Less common, valuable
developer   | 0.125| 2.0  | 0.25   | Medium common, valuable
django      | 0.125| 3.2  | 0.4    | Rare, very valuable
```

### Phase 4: Cosine Similarity Calculation

**Mathematical Concept:**

```
Cosine Similarity = (A · B) / (||A|| × ||B||)

Where:
- A · B = dot product (sum of element-wise products)
- ||A|| = magnitude (length) of vector A
- ||B|| = magnitude (length) of vector B

Result: value between 0 and 1
- 0 = completely different
- 1 = identical
- 0.5 = moderately similar
```

**Implementation:**

```python
# Step 1: Compute similarity matrix
similarity_scores = cosine_similarity(jd_vector, resume_vectors)[0]
# Returns array: [0.78, 0.65, 0.52] for 3 resumes

# Step 2: Scale to percentage
scores = [score * 100 for score in similarity_scores]
# Output: [78.0, 65.0, 52.0]

# Step 3: Round for display
scores = [round(score, 2) for score in scores]
# Output: [78.0, 65.0, 52.0]
```

**Why Sparse Matrices?**
- TF-IDF vectors are 99% zeros (sparse)
- Only store non-zero values and their positions
- Saves massive memory: (4 docs × 8742 terms) vs (actual non-zeros)
- cosine_similarity efficiently handles sparse matrices

### Phase 5: Feedback Generation

**Match Quality Logic:**

```python
def generate_detailed_feedback(job_description, resume_text, score):
    # Step 1: Extract keywords from both
    jd_kw = set(extract_keywords(job_description, top_n=25))
    resume_kw = set(extract_keywords(resume_text, top_n=25))
    
    # Step 2: Calculate matches and gaps
    matched = sorted(list(jd_kw & resume_kw))      # Intersection
    missing = sorted(list(jd_kw - resume_kw))      # Difference
    
    # Step 3: Determine quality tier
    if score >= 75:
        quality = "Excellent Match"
        assessment = "Highly relevant resume with strong alignment..."
    elif score >= 60:
        quality = "Good Match"
        assessment = "Good fit with room for strengthening..."
    elif score >= 40:
        quality = "Fair Match"
        assessment = "Potential but missing key skills..."
    else:
        quality = "Poor Match"
        assessment = "Limited alignment with requirements..."
    
    # Step 4: Generate recommendations
    recommendations = []
    
    # Recommendation 1: Missing high-value skills
    if missing:
        recommendations.append(
            f"Add experience with: {', '.join(missing[:5])}. "
            f"These are key qualifications mentioned in the job description."
        )
    
    # Recommendation 2: Terminology gap
    if len(matched) < len(jd_kw) * 0.5:
        recommendations.append(
            "Consider using industry-specific terminology from the job description. "
            "Use keywords like the ones mentioned in the JD to improve relevance."
        )
    
    # Recommendation 3: Low score
    if score < 50:
        recommendations.append(
            "Highlight projects or experiences demonstrating relevant skills. "
            "Consider including technical certifications or training."
        )
    
    # Recommendation 4: Skill gap analysis
    skill_count_jd = len(jd_kw)
    skill_count_resume = len(resume_kw)
    if skill_count_resume < skill_count_jd * 0.6:
        missing_count = skill_count_jd - len(matched)
        recommendations.append(
            f"The resume lacks {missing_count} out of {skill_count_jd} key skills. "
            f"Focus on showcasing more technical competencies and achievements."
        )
    
    # Recommendation 5: High score
    if score >= 70:
        recommendations.append(
            "Strong resume! Focus on quantifying achievements and providing "
            "specific examples of how you've applied these skills."
        )
    
    # Step 5: Return structured object
    return {
        "matched_keywords": matched,
        "missing_keywords": missing,
        "matched_count": len(matched),
        "missing_count": len(missing),
        "overall_assessment": assessment,
        "match_quality": quality,
        "recommendations": recommendations if recommendations else [
            "Consider adding more specific examples and metrics."
        ]
    }
```

---

## Frontend Component Architecture

### React Hooks & State Management

```javascript
export default function App() {
  // File management
  const [resumeFiles, setResumeFiles] = useState([])
  // Stores: Array of File objects from dropzone
  
  // User input
  const [jobDescription, setJobDescription] = useState('')
  // Stores: Raw text from textarea
  
  // API response
  const [results, setResults] = useState(null)
  // Stores: Ranked results array with feedback
  
  // UI states
  const [isLoading, setIsLoading] = useState(false)        // Loading spinner
  const [error, setError] = useState(null)                 // Error banner
  const [warnings, setWarnings] = useState([])             // Warning banners
  const [fileError, setFileError] = useState(null)         // Upload errors
  const [expandedResult, setExpandedResult] = useState(null) // Expanded feedback
}
```

### Dropzone Integration

```javascript
const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
  setFileError(null)  // Clear previous errors
  
  // Handle rejections
  if (rejectedFiles.length > 0) {
    const reasons = rejectedFiles.map(({ file, errors }) =>
      `${file.name}: ${errors.map(e => e.message).join(', ')}`
    ).join(' | ')
    setFileError(`Some files rejected — ${reasons}`)
  }
  
  // Filter duplicates
  const newFiles = acceptedFiles.filter(
    newFile => !resumeFiles.some(existing => existing.name === newFile.name)
  )
  
  // Check total limit
  const combined = [...resumeFiles, ...newFiles]
  if (combined.length > MAX_FILES) {
    setFileError(`Maximum ${MAX_FILES} files allowed`)
    return
  }
  
  setResumeFiles(combined)
}, [resumeFiles])

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: { 'application/pdf': ['.pdf'] },
  maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  multiple: true,
})
```

### Form Submission Flow

```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setError(null)
  setWarnings([])
  setResults(null)
  
  // Validation
  if (!jobDescription.trim()) {
    setError('Please enter a job description')
    return
  }
  if (resumeFiles.length === 0) {
    setError('Please upload at least one PDF resume')
    return
  }
  
  // Prepare FormData (not JSON, must be multipart)
  const formData = new FormData()
  formData.append('job_description', jobDescription.trim())
  
  // Add each file
  resumeFiles.forEach(file => {
    formData.append('resumes', file)
    // Note: same name "resumes" creates array on backend
  })
  
  // Send request
  setIsLoading(true)
  try {
    const response = await axios.post(API_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    })
    
    const data = response.data
    setResults(data.results)  // Array of ranked results
    
    if (data.warnings && data.warnings.length > 0) {
      setWarnings(data.warnings)
    }
  } catch (err) {
    if (err.response) {
      setError(err.response.data?.error || `Error: ${err.response.status}`)
    } else if (err.request) {
      setError('Cannot reach backend server on port 5000')
    } else {
      setError(`Error: ${err.message}`)
    }
  } finally {
    setIsLoading(false)
  }
}
```

### ResultRow Component (with Feedback)

```javascript
function ResultRow({ result, index, isExpanded, onToggle }) {
  const colors = scoreColor(result.score)
  
  return (
    <>
      {/* Main row - clickable */}
      <tr
        className="hover:bg-surface-hover cursor-pointer"
        onClick={onToggle}  // Toggle expand on click
      >
        {/* Rank */}
        <td className="px-5 py-4">
          <RankIcon rank={result.rank} />
        </td>
        
        {/* Filename */}
        <td className="px-5 py-4">{result.name}</td>
        
        {/* Score bar */}
        <td className="px-5 py-4">
          <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colors.bar}`}
              style={{ width: `${result.score}%` }}
            />
          </div>
        </td>
        
        {/* Score percentage */}
        <td className="px-5 py-4 text-right">
          <span className={`font-bold ${colors.text}`}>
            {result.score.toFixed(1)}%
          </span>
        </td>
        
        {/* Quality badge */}
        <td className="px-5 py-4">
          <Badge label={scoreLabel(result.score)} />
        </td>
        
        {/* Expand icon */}
        <td className="px-5 py-4 text-right">
          <svg
            className={`transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            {/* Chevron down icon */}
          </svg>
        </td>
      </tr>
      
      {/* Expanded feedback row */}
      {isExpanded && result.feedback && (
        <tr className="bg-surface-hover/30">
          <td colSpan={6}>
            <FeedbackPanel feedback={result.feedback} />
          </td>
        </tr>
      )}
    </>
  )
}
```

### FeedbackPanel Component

```javascript
function FeedbackPanel({ feedback, score }) {
  return (
    <div className="space-y-5 p-6">
      
      {/* 1. Assessment Section */}
      <div className="bg-surface/50 border border-surface-border rounded-lg p-4">
        <h4 className="font-semibold mb-2">Assessment</h4>
        <p className="text-sm text-gray-400">
          {feedback.overall_assessment}
        </p>
      </div>
      
      {/* 2. Matched Skills */}
      <div>
        <h4 className="font-semibold text-emerald-300 mb-3">
          Matched Skills ({feedback.matched_count})
        </h4>
        <div className="flex flex-wrap gap-2">
          {feedback.matched_keywords.map(keyword => (
            <Badge key={keyword} label={`✓ ${keyword}`} color="green" />
          ))}
        </div>
      </div>
      
      {/* 3. Missing Skills */}
      <div>
        <h4 className="font-semibold text-amber-300 mb-3">
          Missing Skills ({feedback.missing_count})
        </h4>
        <div className="flex flex-wrap gap-2">
          {feedback.missing_keywords.map(keyword => (
            <Badge key={keyword} label={`✗ ${keyword}`} color="amber" />
          ))}
        </div>
      </div>
      
      {/* 4. Recommendations */}
      <div>
        <h4 className="font-semibold text-brand-300 mb-3">How to Improve</h4>
        <ul className="space-y-2">
          {feedback.recommendations.map((rec, idx) => (
            <li key={idx} className="text-sm text-gray-400 flex gap-2">
              <span className="text-brand-400">→</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

---

## Data Flow Diagrams

### Complete Request-Response Cycle

```
USER BROWSER
    ↓
[1] Fill job description textarea
    ↓ onChange={(e) => setJobDescription(e.target.value)}
[2] Upload PDFs via dropzone
    ↓ onDrop manages file state
[3] Click "Screen Now"
    ↓
[4] FormData Creation
    - job_description: string
    - resumes: File[3]
    ↓
[5] Axios POST to /api/screen
    - Headers: multipart/form-data
    - Timeout: 60s
    ↓
BACKEND (Flask)
    ↓
[6] Receive POST /api/screen
    ↓
[7] Validate request
    - Check job_description length
    - Check file count
    - Set isLoading = true (show spinner)
    ↓
[8] Extract PDFs
    - For each file in request.files['resumes']
    - Use PyMuPDF to extract text
    - Store in resumes = [{"name": ..., "text": ...}, ...]
    ↓
[9] Build corpus
    - corpus = [job_description] + text from all resumes
    ↓
[10] TF-IDF Vectorization
    - Fit TfidfVectorizer on corpus
    - Transform to matrix
    ↓
[11] Cosine Similarity
    - Compute similarity of JD vs each resume
    - Get scores [0-1]
    ↓
[12] Generate Feedback (for each resume)
    - Extract keywords
    - Match with JD keywords
    - Determine quality tier
    - Create recommendations
    ↓
[13] Sort Results
    - Sort by score descending
    - Add ranks
    ↓
[14] Return JSON Response
    {
      "results": [
        {
          "rank": 1,
          "name": "file.pdf",
          "score": 87.5,
          "feedback": { ... }
        }
      ]
    }
    ↓
USER BROWSER
    ↓
[15] Axios receives response
    ↓ if error → setError()
    ↓ if success → setResults()
    ↓ if warnings → setWarnings()
    ↓
[16] Component re-renders with results
    - Set isLoading = false (remove spinner)
    - Render results table
    ↓
[17] User sees ranked results
    - Rank | Name | Score Bar | Score % | Quality Badge | Expand ↓
    ↓
[18] User clicks row to expand
    ↓ onClick → onToggle()
    ↓ setExpandedResult(result.name)
    ↓
[19] Component re-renders with feedback
    - FeedbackPanel appears below row
    - Shows Assessment, Matched Skills, Missing Skills, Recommendations
    ↓
[20] User can expand other rows
    - Only one expanded at a time
    - setExpandedResult(newResult.name) replaces previous
```

---

## Code Examples

### Complete Backend Flow Example

```python
# Configuration
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Helper functions...
def extract_text_from_pdf(file_bytes):
    # ... (extraction logic)
    pass

def extract_keywords(text, top_n=20):
    # ... (keyword extraction logic)
    pass

def generate_detailed_feedback(job_description, resume_text, score):
    # ... (feedback generation logic)
    pass

def compute_similarity_scores_with_feedback(job_description, resumes):
    if not resumes:
        return []
    
    # 1. Build corpus
    corpus = [job_description] + [r["text"] for r in resumes]
    
    # 2. Vectorize
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=10_000,
        sublinear_tf=True,
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)
    
    # 3. Compute similarity
    jd_vector = tfidf_matrix[0:1]
    resume_vectors = tfidf_matrix[1:]
    similarity_scores = cosine_similarity(jd_vector, resume_vectors)[0]
    
    # 4. Build results with feedback
    results = []
    for idx, resume in enumerate(resumes):
        score = round(float(similarity_scores[idx]) * 100, 2)
        feedback = generate_detailed_feedback(
            job_description,
            resume["text"],
            score
        )
        results.append({
            "name": resume["name"],
            "score": score,
            "feedback": feedback
        })
    
    # 5. Sort and rank
    results.sort(key=lambda x: x["score"], reverse=True)
    for rank, result in enumerate(results, start=1):
        result["rank"] = rank
    
    return results

# Main endpoint
@app.route("/api/screen", methods=["POST"])
def screen_resumes():
    # Validate
    job_description = request.form.get("job_description", "").strip()
    if not job_description or len(job_description) < 20:
        return jsonify({"error": "Invalid job description"}), 400
    
    # Extract files
    uploaded_files = request.files.getlist("resumes")
    if not uploaded_files:
        return jsonify({"error": "No resumes uploaded"}), 400
    
    # Process PDFs
    resumes = []
    for pdf_file in uploaded_files:
        try:
            file_bytes = pdf_file.read()
            text = extract_text_from_pdf(file_bytes)
            resumes.append({"name": pdf_file.filename, "text": text})
        except Exception as e:
            return jsonify({"error": str(e)}), 422
    
    # Score with feedback
    results = compute_similarity_scores_with_feedback(job_description, resumes)
    
    return jsonify({
        "results": results,
        "total_screened": len(results)
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

### Complete Frontend Flow Example

```javascript
import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

const API_URL = 'http://localhost:5000/api/screen'

export default function App() {
  // State
  const [resumeFiles, setResumeFiles] = useState([])
  const [jobDescription, setJobDescription] = useState('')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedResult, setExpandedResult] = useState(null)
  
  // Dropzone
  const onDrop = useCallback(acceptedFiles => {
    setResumeFiles(prev => [...prev, ...acceptedFiles])
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  })
  
  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!jobDescription.trim() || resumeFiles.length === 0) {
      setError('Please fill all fields')
      return
    }
    
    const formData = new FormData()
    formData.append('job_description', jobDescription)
    resumeFiles.forEach(f => formData.append('resumes', f))
    
    setIsLoading(true)
    try {
      const { data } = await axios.post(API_URL, formData)
      setResults(data.results)
      setError(null)
    } catch (err) {
      setError('Failed to screen resumes')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Render
  return (
    <div>
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste job description..."
        />
        
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <p>Drop resumes here or click to browse</p>
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Screening...' : 'Screen Resumes'}
        </button>
      </form>
      
      {/* Results */}
      {results && (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Score</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <React.Fragment key={result.name}>
                <tr onClick={() => setExpandedResult(
                  expandedResult === result.name ? null : result.name
                )}>
                  <td>{result.rank}</td>
                  <td>{result.name}</td>
                  <td>{result.score.toFixed(1)}%</td>
                  <td>
                    {expandedResult === result.name ? '▲' : '▼'}
                  </td>
                </tr>
                
                {expandedResult === result.name && result.feedback && (
                  <tr>
                    <td colSpan={4}>
                      <FeedbackPanel feedback={result.feedback} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function FeedbackPanel({ feedback }) {
  return (
    <div>
      <h4>Assessment</h4>
      <p>{feedback.overall_assessment}</p>
      
      <h4>Matched Skills ({feedback.matched_count})</h4>
      {feedback.matched_keywords.join(', ')}
      
      <h4>Missing Skills ({feedback.missing_count})</h4>
      {feedback.missing_keywords.join(', ')}
      
      <h4>Recommendations</h4>
      <ul>
        {feedback.recommendations.map((rec, i) => (
          <li key={i}>{rec}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Testing & Debugging

### Backend Testing

**Test 1: PDF Extraction**
```python
# Create test PDF
import fitz
doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 50), "Python Django developer")
doc.save("test_resume.pdf")

# Test extraction
with open("test_resume.pdf", "rb") as f:
    text = extract_text_from_pdf(f.read())
    assert "Python" in text
    print(f"✓ Extracted: {text}")
```

**Test 2: TF-IDF Vectorization**
```python
from sklearn.feature_extraction.text import TfidfVectorizer

documents = [
    "Python Django developer",
    "Java Spring developer",
    "Python Django expert"
]

vectorizer = TfidfVectorizer()
matrix = vectorizer.fit_transform(documents)

print(f"Shape: {matrix.shape}")  # (3, vocab_size)
print(f"Terms: {vectorizer.get_feature_names_out()}")
```

**Test 3: Cosine Similarity**
```python
from sklearn.metrics.pairwise import cosine_similarity

# Test vectors
v1 = [[1, 0, 0]]  # Pure Python
v2 = [[0.8, 0.2, 0]]  # Mostly Python
v3 = [[0, 1, 0]]  # Pure Java

similarities = cosine_similarity(v1, [v2, v3])[0]
print(similarities)  # [0.8, 0.0]
```

### Common Issues & Solutions

**Issue 1: PDF Extraction Fails**
```python
# Problem: Scanned/image PDFs return empty text
# Solution: Check if text is extractable
text = extract_text_from_pdf(file_bytes)
if not text:
    raise ValueError("PDF contains no extractable text (may be scanned)")
```

**Issue 2: CORS Errors**
```python
# Problem: Frontend can't reach backend
# Solution: Ensure CORS is configured
CORS(app, resources={r"/api/*": {"origins": "*"}})

# For production, restrict origins:
CORS(app, resources={r"/api/*": {"origins": ["https://yourdomain.com"]}})
```

**Issue 3: Memory Issues with Large Files**
```python
# Problem: Large PDF causes out-of-memory
# Solution: Stream processing or file size limits

# Add file size validation
MAX_SIZE = 10 * 1024 * 1024  # 10MB
if len(file_bytes) > MAX_SIZE:
    raise ValueError(f"File too large (max {MAX_SIZE} bytes)")
```

### Debugging Logs

**Enable Debug Logging:**
```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# In functions
logger.debug(f"Extracted {len(text)} characters from PDF")
logger.info(f"Computed similarity for {len(resumes)} resumes")
logger.warning(f"Resume {name} has no extractable text")
logger.error(f"Failed to process file: {error}")
```

---

## Performance Optimization

### Optimization Strategies

**1. Caching Job Description Vectorization**
```python
# Current: Re-vectorize JD for each request
# Optimized: Cache JD vector when possible

jd_cache = {}

def get_jd_vector(jd_text):
    jd_hash = hash(jd_text)
    if jd_hash in jd_cache:
        return jd_cache[jd_hash]
    
    # Compute and cache
    vectorizer = TfidfVectorizer()
    vector = vectorizer.fit_transform([jd_text])
    jd_cache[jd_hash] = vector
    return vector
```

**2. Batch Processing Large Resume Sets**
```python
# For 1000+ resumes, process in batches
def batch_similarity(jd_vector, resume_vectors, batch_size=100):
    results = []
    for i in range(0, len(resume_vectors), batch_size):
        batch = resume_vectors[i:i+batch_size]
        scores = cosine_similarity(jd_vector, batch)
        results.extend(scores[0])
    return results
```

**3. Async PDF Extraction**
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def extract_pdfs_async(files):
    executor = ThreadPoolExecutor()
    tasks = []
    for file in files:
        task = asyncio.get_event_loop().run_in_executor(
            executor,
            extract_text_from_pdf,
            file.read()
        )
        tasks.append(task)
    return await asyncio.gather(*tasks)
```

**4. Limit Vocabulary Size**
```python
# Config
vectorizer = TfidfVectorizer(
    max_features=5_000,  # Reduced from 10_000
    # Faster vectorization
    # Most important terms still captured
)
```

---

**Implementation Complete!**  
This technical guide provides all necessary details for understanding and extending SmartHire AI.

