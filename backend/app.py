"""
SmartHire AI - Backend Flask API
Cloud-Native Resume Screener & Applicant Tracking System
Author: Nevesh Divya | RA2311031010007 | SRM Institute of Science and Technology
"""

import os
import io
import logging
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ─── Application Factory ───────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Allow requests from the Vite dev server and any deployed frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ─── Helper Functions ──────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract plain text from a PDF given its raw bytes.

    Uses PyMuPDF (fitz) to iterate over every page and concatenate
    all text blocks into a single string.  Returns an empty string
    if the PDF has no selectable text (scanned / image-only PDF).

    Args:
        file_bytes: Raw bytes of the uploaded PDF file.

    Returns:
        A cleaned string containing the extracted text.

    Raises:
        ValueError: If the file cannot be parsed as a PDF at all.
    """
    try:
        pdf_stream = io.BytesIO(file_bytes)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")
        text_parts = []
        for page_index in range(len(doc)):
            page = doc.load_page(page_index)
            page_text = page.get_text("text")
            if page_text:
                text_parts.append(page_text.strip())
        doc.close()
        full_text = "\n".join(text_parts).strip()
        return full_text
    except fitz.EmptyFileError as exc:
        logger.warning("Empty or corrupted PDF received: %s", exc)
        raise ValueError("The uploaded file is empty or corrupted.") from exc
    except Exception as exc:
        logger.error("Failed to parse PDF: %s", exc)
        raise ValueError(f"Unable to parse the PDF file: {exc}") from exc


def compute_similarity_scores(job_description: str, resumes: list[dict]) -> list[dict]:
    """
    Compute TF-IDF cosine similarity between the job description and each resume.

    Algorithm:
        1. Build a corpus: [job_description] + [resume_text for each resume]
        2. Fit a TfidfVectorizer on the corpus (removes English stop-words).
        3. Transform the corpus to a TF-IDF matrix.
        4. Compute cosine similarity of job_description vector against each
           resume vector.
        5. Return results sorted in descending order of similarity score.

    Args:
        job_description: The raw text of the job description.
        resumes: A list of dicts, each with keys ``name`` (str) and ``text`` (str).

    Returns:
        A sorted list of dicts, each containing:
            - ``name``  (str)  : File name of the resume.
            - ``score`` (float): Similarity percentage (0–100), rounded to 2 dp.
            - ``rank``  (int)  : Rank starting from 1.
    """
    if not resumes:
        return []

    corpus = [job_description] + [r["text"] for r in resumes]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),      # unigrams + bigrams for richer context
        max_features=10_000,     # cap vocab size for performance
        sublinear_tf=True,       # apply log normalization to TF
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # job_description is index 0; resumes are indices 1 … n
    jd_vector = tfidf_matrix[0:1]
    resume_vectors = tfidf_matrix[1:]

    similarity_scores = cosine_similarity(jd_vector, resume_vectors)[0]

    results = []
    for idx, resume in enumerate(resumes):
        score = round(float(similarity_scores[idx]) * 100, 2)
        results.append({"name": resume["name"], "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)

    for rank, result in enumerate(results, start=1):
        result["rank"] = rank

    return results


def extract_keywords(text: str, top_n: int = 20) -> list[str]:
    """
    Extract key technical skills and keywords from text.
    
    Uses a simple approach: extracts capitalized words, common programming terms,
    and framework names from the text. This serves as a basic keyword extraction.
    
    Args:
        text: Raw text to extract keywords from.
        top_n: Maximum number of keywords to extract.
    
    Returns:
        A list of extracted keywords.
    """
    # Common technical keywords and skill categories
    common_skills = {
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
        'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'spring', 'node',
        'nodejs', 'sql', 'nosql', 'mongodb', 'postgres', 'mysql', 'redis',
        'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'ci/cd',
        'html', 'css', 'rest', 'api', 'graphql', 'ml', 'ai', 'nlp', 'machine learning',
        'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
        'agile', 'scrum', 'jira', 'linux', 'windows', 'macos', 'unix',
        'testing', 'pytest', 'junit', 'tdd', 'bdd', 'devops', 'microservices',
        'mvc', 'mvvm', 'design patterns', 'oop', 'functional programming',
        'html5', 'css3', 'bootstrap', 'tailwind', 'sass', 'webpack', 'vite',
        'communication', 'leadership', 'problem-solving', 'teamwork', 'collaboration',
        'project management', 'requirements analysis', 'system design'
    }
    
    text_lower = text.lower()
    words = re.findall(r'\b[a-zA-Z\+\#\-\.]+\b', text_lower)
    
    # Extract keywords that are in our common skills list or are technical-looking
    found_keywords = []
    for word in words:
        word_clean = word.strip('.,;:!?')
        if word_clean in common_skills and word_clean not in found_keywords:
            found_keywords.append(word_clean)
    
    # Also extract some capitalized words (likely company/technology names)
    capitalized = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
    for cap_word in capitalized[:10]:
        if len(cap_word) > 3 and cap_word.lower() not in found_keywords:
            found_keywords.append(cap_word.lower())
    
    return found_keywords[:top_n]


def generate_detailed_feedback(job_description: str, resume_text: str, score: float) -> dict:
    """
    Generate detailed feedback about why a resume matches or doesn't match the job description.
    
    Analyzes keywords, skills, and provides specific recommendations for improvement.
    
    Args:
        job_description: The job description text.
        resume_text: The resume text.
        score: The similarity score (0-100).
    
    Returns:
        A dict with feedback containing:
            - matched_keywords: list of skills/keywords found in both
            - missing_keywords: list of important keywords missing from resume
            - overall_assessment: brief assessment of the fit
            - recommendations: list of suggestions for improvement
            - match_quality: categorical rating (Excellent, Good, Fair, Poor)
    """
    jd_keywords = set(extract_keywords(job_description, top_n=25))
    resume_keywords = set(extract_keywords(resume_text, top_n=25))
    
    matched = sorted(list(jd_keywords & resume_keywords))
    missing = sorted(list(jd_keywords - resume_keywords))
    
    # Determine match quality
    if score >= 75:
        match_quality = "Excellent Match"
        assessment = "This resume is highly relevant to the job description. The candidate has demonstrated strong alignment with most key requirements."
    elif score >= 60:
        match_quality = "Good Match"
        assessment = "This resume shows good fit with the job description. The candidate has relevant skills but could strengthen their profile."
    elif score >= 40:
        match_quality = "Fair Match"
        assessment = "This resume has potential but is missing some important skills or experience mentioned in the job description."
    else:
        match_quality = "Poor Match"
        assessment = "This resume has limited alignment with the job description. Significant improvements needed in relevant skills and experience."
    
    # Generate recommendations
    recommendations = []
    
    if missing:
        recommendations.append(
            f"Add experience with: {', '.join(missing[:5])}. "
            f"These are key qualifications mentioned in the job description."
        )
    
    if len(matched) < len(jd_keywords) * 0.5:
        recommendations.append(
            "Consider using industry-specific terminology from the job description. "
            "Use keywords like the ones mentioned in the JD to improve relevance."
        )
    
    if score < 50:
        recommendations.append(
            "Highlight projects or experiences that demonstrate skills relevant to this role. "
            "Consider including technical certifications or training."
        )
    
    # Skills gap analysis
    skill_count_jd = len(jd_keywords)
    skill_count_resume = len(resume_keywords)
    if skill_count_resume < skill_count_jd * 0.6:
        missing_count = skill_count_jd - len(matched)
        recommendations.append(
            f"The resume lacks {missing_count} out of {skill_count_jd} key skills. "
            f"Focus on showcasing more technical competencies and relevant achievements."
        )
    
    if score >= 70:
        recommendations.append(
            "Strong resume! Focus on quantifying achievements and providing specific examples "
            "of how you've applied these skills in previous roles."
        )
    
    return {
        "matched_keywords": matched,
        "missing_keywords": missing,
        "matched_count": len(matched),
        "missing_count": len(missing),
        "overall_assessment": assessment,
        "match_quality": match_quality,
        "recommendations": recommendations if recommendations else [
            "Consider adding more specific examples and metrics to strengthen your application."
        ]
    }


def compute_similarity_scores_with_feedback(job_description: str, resumes: list[dict]) -> list[dict]:
    """
    Compute TF-IDF cosine similarity with detailed feedback for each resume.

    Args:
        job_description: The raw text of the job description.
        resumes: A list of dicts, each with keys ``name`` (str) and ``text`` (str).

    Returns:
        A sorted list of dicts, each containing score, rank, and detailed feedback.
    """
    if not resumes:
        return []

    corpus = [job_description] + [r["text"] for r in resumes]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=10_000,
        sublinear_tf=True,
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)

    jd_vector = tfidf_matrix[0:1]
    resume_vectors = tfidf_matrix[1:]

    similarity_scores = cosine_similarity(jd_vector, resume_vectors)[0]

    results = []
    for idx, resume in enumerate(resumes):
        score = round(float(similarity_scores[idx]) * 100, 2)
        
        # Generate detailed feedback
        feedback = generate_detailed_feedback(job_description, resume["text"], score)
        
        results.append({
            "name": resume["name"],
            "score": score,
            "feedback": feedback
        })

    results.sort(key=lambda x: x["score"], reverse=True)

    for rank, result in enumerate(results, start=1):
        result["rank"] = rank

    return results


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple liveness probe for container orchestrators."""
    return jsonify({"status": "ok", "service": "SmartHire AI Backend"}), 200


@app.route("/api/screen", methods=["POST"])
def screen_resumes():
    """
    POST /api/screen

    Accepts a multipart/form-data request containing:
        - ``job_description`` (str)        : Plain-text job description.
        - ``resumes``         (file, multi) : One or more PDF resume files.

    Returns:
        JSON array of candidate objects sorted by match percentage:
        [
            {"rank": 1, "name": "john_doe.pdf", "score": 87.34},
            ...
        ]

    Error responses:
        400 – Missing or invalid input.
        422 – PDF could not be parsed (empty / scanned / corrupted).
        500 – Unexpected server-side error.
    """
    # ── Validate job description ───────────────────────────────────────────
    job_description = request.form.get("job_description", "").strip()
    if not job_description:
        logger.warning("Request received with empty job_description.")
        return jsonify({"error": "job_description is required and cannot be empty."}), 400

    if len(job_description) < 20:
        return (
            jsonify({"error": "job_description is too short. Please provide a meaningful description."}),
            400,
        )

    # ── Validate uploaded files ────────────────────────────────────────────
    uploaded_files = request.files.getlist("resumes")
    if not uploaded_files or all(f.filename == "" for f in uploaded_files):
        logger.warning("No resume files attached to request.")
        return jsonify({"error": "At least one PDF resume file must be uploaded."}), 400

    # ── Extract text from each PDF ─────────────────────────────────────────
    resumes = []
    extraction_errors = []

    for pdf_file in uploaded_files:
        filename = pdf_file.filename

        if not filename.lower().endswith(".pdf"):
            extraction_errors.append(
                {"file": filename, "error": "Only PDF files are accepted."}
            )
            continue

        try:
            file_bytes = pdf_file.read()
            text = extract_text_from_pdf(file_bytes)

            if not text:
                extraction_errors.append(
                    {
                        "file": filename,
                        "error": (
                            "No extractable text found. The PDF may be a scanned image. "
                            "Please upload a text-based PDF."
                        ),
                    }
                )
                continue

            resumes.append({"name": filename, "text": text})
            logger.info("Successfully extracted text from '%s' (%d chars).", filename, len(text))

        except ValueError as exc:
            extraction_errors.append({"file": filename, "error": str(exc)})
        except Exception as exc:
            logger.exception("Unexpected error processing file '%s'.", filename)
            extraction_errors.append({"file": filename, "error": "Internal processing error."})

    if not resumes:
        return (
            jsonify(
                {
                    "error": "None of the uploaded files could be processed.",
                    "details": extraction_errors,
                }
            ),
            422,
        )

    # ── Compute similarity scores ──────────────────────────────────────────
    try:
        results = compute_similarity_scores_with_feedback(job_description, resumes)
    except Exception as exc:
        logger.exception("Error during similarity computation.")
        return jsonify({"error": "Failed to compute similarity scores.", "details": str(exc)}), 500

    response_payload = {
        "results": results,
        "total_screened": len(results),
    }

    if extraction_errors:
        response_payload["warnings"] = extraction_errors

    logger.info(
        "Screened %d resume(s) against job description. Top candidate: %s (%.2f%%)",
        len(results),
        results[0]["name"] if results else "N/A",
        results[0]["score"] if results else 0.0,
    )

    return jsonify(response_payload), 200


# ─── Error Handlers ───────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found."}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "HTTP method not allowed on this endpoint."}), 405


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "Request payload too large. Limit total upload to 50 MB."}), 413


@app.errorhandler(500)
def internal_error(error):
    logger.exception("Unhandled 500 error.")
    return jsonify({"error": "An unexpected server error occurred."}), 500


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
