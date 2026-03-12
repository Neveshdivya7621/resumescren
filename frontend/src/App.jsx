import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = '/api/screen'
const MAX_FILES = 20
const MAX_FILE_SIZE_MB = 10

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated brand logo / wordmark */
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand-md">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="18" cy="6" r="3" fill="#a855f7"/>
            <path d="M16.5 6h3M18 4.5v3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="absolute -inset-1 rounded-xl bg-brand-gradient opacity-20 blur-sm -z-10" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          <span className="gradient-text">SmartHire AI</span>
        </h1>
        <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">Resume Screener</p>
      </div>
    </div>
  )
}

/** Badge showing a tag */
function Badge({ label, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-500/10 text-brand-300 border-brand-500/20',
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    red:   'bg-red-500/10   text-red-300   border-red-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[color]}`}>
      {label}
    </span>
  )
}

/** Score colour based on match percentage */
function scoreColor(score) {
  if (score >= 75) return { bar: 'from-emerald-500 to-green-400', text: 'text-emerald-400', badge: 'green' }
  if (score >= 50) return { bar: 'from-brand-500 to-violet-400', text: 'text-brand-400', badge: 'brand' }
  if (score >= 25) return { bar: 'from-amber-500 to-yellow-400', text: 'text-amber-400', badge: 'purple' }
  return { bar: 'from-red-500 to-rose-400', text: 'text-red-400', badge: 'red' }
}

/** Rank medal icons for top 3 */
function RankIcon({ rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  if (medals[rank]) {
    return <span className="text-xl leading-none">{medals[rank]}</span>
  }
  return (
    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-hover border border-surface-border text-xs font-bold text-gray-400">
      {rank}
    </span>
  )
}

/** A single row in the results table */
function ResultRow({ result, index, isExpanded, onToggle }) {
  const colors = scoreColor(result.score)
  const label =
    result.score >= 75 ? 'Excellent Match' :
    result.score >= 50 ? 'Good Match' :
    result.score >= 25 ? 'Partial Match' : 'Low Match'

  return (
    <>
      <tr
        className="border-b border-surface-border hover:bg-surface-hover transition-colors duration-150 fade-in cursor-pointer"
        style={{ animationDelay: `${index * 60}ms` }}
        onClick={onToggle}
      >
        {/* Rank */}
        <td className="px-5 py-4">
          <div className="flex items-center justify-center">
            <RankIcon rank={result.rank} />
          </div>
        </td>

        {/* File name */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-surface-hover border border-surface-border flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-200 truncate max-w-[200px] sm:max-w-xs" title={result.name}>
              {result.name}
            </span>
          </div>
        </td>

        {/* Score bar */}
        <td className="px-5 py-4 w-64 hidden md:table-cell">
          <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colors.bar} score-bar`}
              style={{ '--bar-width': `${result.score}%` }}
            />
          </div>
        </td>

        {/* Score % */}
        <td className="px-5 py-4 text-right">
          <span className={`text-xl font-bold font-mono ${colors.text}`}>
            {result.score.toFixed(1)}%
          </span>
        </td>

        {/* Badge */}
        <td className="px-5 py-4 text-right hidden sm:table-cell">
          <Badge label={label} color={colors.badge} />
        </td>

        {/* Expand icon */}
        <td className="px-5 py-4 text-right">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </td>
      </tr>

      {/* Expanded feedback row */}
      {isExpanded && result.feedback && (
        <tr className="border-b border-surface-border bg-surface-hover/30">
          <td colSpan={6} className="px-5 py-6">
            <FeedbackPanel feedback={result.feedback} score={result.score} />
          </td>
        </tr>
      )}
    </>
  )
}

/** Component to display detailed feedback about a resume */
function FeedbackPanel({ feedback, score }) {
  return (
    <div className="space-y-5">
      {/* Overall Assessment */}
      <div className="bg-surface/50 border border-surface-border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-200 mb-2">Assessment</h4>
        <p className="text-sm text-gray-400 leading-relaxed">{feedback.overall_assessment}</p>
      </div>

      {/* Matched Skills */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-emerald-300">
            Matched Skills ({feedback.matched_count}/{feedback.matched_count + feedback.missing_count})
          </h4>
        </div>
        {feedback.matched_keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2 ml-7">
            {feedback.matched_keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              >
                ✓ {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 ml-7">No significant skill matches found.</p>
        )}
      </div>

      {/* Missing Skills */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2v2m0-2v-2" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-amber-300">
            Missing Skills ({feedback.missing_count})
          </h4>
        </div>
        {feedback.missing_keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2 ml-7">
            {feedback.missing_keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
              >
                ✗ {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 ml-7">All key skills are present in the resume.</p>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-brand-300">How to Improve</h4>
        </div>
        <ul className="space-y-2 ml-7">
          {feedback.recommendations.map((rec, idx) => (
            <li key={idx} className="text-xs text-gray-400 leading-relaxed flex gap-2">
              <span className="text-brand-400 mt-0.5">→</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Shimmer skeleton row for loading state */
function SkeletonRow() {
  return (
    <tr className="border-b border-surface-border">
      <td className="px-5 py-4"><div className="shimmer h-7 w-7 rounded-full mx-auto" /></td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="shimmer w-9 h-9 rounded-lg" />
          <div className="shimmer h-4 w-44 rounded" />
        </div>
      </td>
      <td className="px-5 py-4 hidden md:table-cell"><div className="shimmer h-2 w-full rounded-full" /></td>
      <td className="px-5 py-4 text-right"><div className="shimmer h-6 w-16 rounded ml-auto" /></td>
      <td className="px-5 py-4 text-right hidden sm:table-cell"><div className="shimmer h-5 w-24 rounded-full ml-auto" /></td>
    </tr>
  )
}

/** File chip shown below the dropzone */
function FileChip({ file, onRemove }) {
  const sizeKB = (file.size / 1024).toFixed(0)
  return (
    <div className="flex items-center gap-2 bg-surface-hover border border-surface-border rounded-lg px-3 py-1.5 text-sm">
      <svg className="w-3.5 h-3.5 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="text-gray-300 truncate max-w-[140px]" title={file.name}>{file.name}</span>
      <span className="text-gray-600 shrink-0">{sizeKB} KB</span>
      <button
        onClick={() => onRemove(file.name)}
        className="ml-1 text-gray-600 hover:text-red-400 transition-colors shrink-0"
        aria-label={`Remove ${file.name}`}
      >
        ✕
      </button>
    </div>
  )
}

/** Warning / error alert banner */
function AlertBanner({ message, type = 'error' }) {
  const styles = {
    error:   'bg-red-500/10   border-red-500/30   text-red-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  }
  const icons = {
    error:   '⛔',
    warning: '⚠️',
    success: '✅',
  }
  return (
    <div className={`flex items-start gap-3 border rounded-xl p-4 text-sm ${styles[type]}`}>
      <span className="text-base shrink-0">{icons[type]}</span>
      <p>{message}</p>
    </div>
  )
}

// ─── Main App Component ───────────────────────────────────────────────────────

export default function App() {
  const [resumeFiles, setResumeFiles]     = useState([])
  const [jobDescription, setJobDescription] = useState('')
  const [results, setResults]             = useState(null)
  const [isLoading, setIsLoading]         = useState(false)
  const [error, setError]                 = useState(null)
  const [warnings, setWarnings]           = useState([])
  const [fileError, setFileError]         = useState(null)
  const [expandedResult, setExpandedResult] = useState(null)

  // ── Dropzone Configuration ─────────────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setFileError(null)

    if (rejectedFiles.length > 0) {
      const reasons = rejectedFiles.map(({ file, errors }) =>
        `${file.name}: ${errors.map(e => e.message).join(', ')}`
      ).join(' | ')
      setFileError(`Some files were rejected — ${reasons}`)
    }

    const newFiles = acceptedFiles.filter(
      newFile => !resumeFiles.some(existing => existing.name === newFile.name)
    )

    const combined = [...resumeFiles, ...newFiles]
    if (combined.length > MAX_FILES) {
      setFileError(`You can upload a maximum of ${MAX_FILES} resumes at once.`)
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

  const removeFile = useCallback((fileName) => {
    setResumeFiles(prev => prev.filter(f => f.name !== fileName))
  }, [])

  const clearAll = () => {
    setResumeFiles([])
    setJobDescription('')
    setResults(null)
    setError(null)
    setWarnings([])
    setFileError(null)
    setExpandedResult(null)
  }

  // ── Form Submission ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setWarnings([])
    setResults(null)

    if (!jobDescription.trim()) {
      setError('Please enter a job description before screening.')
      return
    }
    if (resumeFiles.length === 0) {
      setError('Please upload at least one PDF resume to screen.')
      return
    }

    const formData = new FormData()
    formData.append('job_description', jobDescription.trim())
    resumeFiles.forEach(file => formData.append('resumes', file))

    setIsLoading(true)
    try {
      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      })
      const data = response.data
      setResults(data.results)
      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings)
      }
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.error || `Server error ${err.response.status}`
        setError(msg)
      } else if (err.request) {
        setError('Cannot reach the SmartHire AI server. Make sure the backend is running on port 5000.')
      } else {
        setError(`Unexpected error: ${err.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface text-white">

      {/* ── Ambient BG glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-brand-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-violet-600/6 rounded-full blur-[100px]" />
      </div>

      {/* ── Grid overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 sm:py-16">

        {/* ── Header ── */}
        <header className="flex items-center justify-between mb-12 fade-in">
          <Logo />
          <div className="hidden sm:flex items-center gap-3">
            <Badge label="TF-IDF NLP" color="brand" />
            <Badge label="Cloud-Native" color="purple" />
          </div>
        </header>

        {/* ── Hero Text ── */}
        <div className="text-center mb-12 fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Screen Resumes with{' '}
            <span className="gradient-text">Artificial Intelligence</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Upload candidate PDFs, paste your job description, and instantly rank applicants
            by semantic relevance using TF-IDF vectorisation and cosine similarity.
          </p>
        </div>

        {/* ── Main Form ── */}
        <form
          onSubmit={handleSubmit}
          className="space-y-8 fade-in"
          style={{ animationDelay: '200ms' }}
          id="screen-form"
          aria-label="Resume Screening Form"
        >

          {/* ── Step 1: Job Description ── */}
          <section className="glass-card p-6 space-y-3">
            <label
              htmlFor="job-description"
              className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wider"
            >
              <span className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-bold flex items-center justify-center">
                1
              </span>
              Job Description
            </label>
            <textarea
              id="job-description"
              name="job_description"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              rows={7}
              placeholder="Paste the full job description here — include required skills, qualifications, and responsibilities. The more detail you provide, the more accurate the matching will be."
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-gray-200 placeholder-gray-600 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
            />
            <p className="text-xs text-gray-600 text-right">
              {jobDescription.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </section>

          {/* ── Step 2: Resume Upload ── */}
          <section className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wider">
              <span className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-bold flex items-center justify-center">
                2
              </span>
              Upload Resumes (PDF only, max {MAX_FILES} files, {MAX_FILE_SIZE_MB} MB each)
            </div>

            {/* Drop Zone */}
            <div
              {...getRootProps()}
              id="resume-dropzone"
              role="button"
              tabIndex={0}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
                ${isDragActive
                  ? 'dropzone-active'
                  : 'border-surface-border hover:border-brand-500/40 hover:bg-brand-500/5'
                }`}
            >
              <input {...getInputProps()} id="resume-file-input" aria-label="Upload Resume PDFs" />

              <div className="flex flex-col items-center gap-4 pointer-events-none">
                <div className={`transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}>
                  <svg className="w-14 h-14 text-brand-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                {isDragActive ? (
                  <p className="text-brand-300 font-semibold text-lg">Drop the PDFs here…</p>
                ) : (
                  <div>
                    <p className="text-gray-300 font-semibold text-base">
                      Drag & drop PDF resumes here
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      or <span className="text-brand-400 underline underline-offset-2">click to browse files</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File error */}
            {fileError && <AlertBanner message={fileError} type="warning" />}

            {/* File chips */}
            {resumeFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">
                    {resumeFiles.length} file{resumeFiles.length !== 1 ? 's' : ''} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => setResumeFiles([])}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                  >
                    Clear all files
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resumeFiles.map(file => (
                    <FileChip key={file.name} file={file} onRemove={removeFile} />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Alert Banner ── */}
          {error && <AlertBanner message={error} type="error" />}

          {/* ── Submit & Reset Buttons ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              id="screen-button"
              disabled={isLoading}
              className="flex-1 relative group bg-brand-gradient text-white font-semibold py-3.5 px-8 rounded-xl
                hover:opacity-90 active:scale-[0.98] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                shadow-brand-md hover:shadow-brand-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analysing Resumes…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Screen Candidates Now
                </span>
              )}
            </button>

            {(results || resumeFiles.length > 0 || jobDescription) && (
              <button
                type="button"
                onClick={clearAll}
                className="px-6 py-3.5 rounded-xl border border-surface-border text-gray-400 hover:text-gray-200 hover:border-gray-500 hover:bg-surface-hover transition-all duration-200 text-sm font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* ── Loading Skeleton ── */}
        {isLoading && (
          <div className="mt-10 glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border">
              <div className="shimmer h-5 w-48 rounded" />
            </div>
            <table className="w-full">
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Warnings ── */}
        {warnings.length > 0 && !isLoading && (
          <div className="mt-6 space-y-2">
            {warnings.map((w, i) => (
              <AlertBanner
                key={i}
                message={`${w.file}: ${w.error}`}
                type="warning"
              />
            ))}
          </div>
        )}

        {/* ── Results Table ── */}
        {results && !isLoading && (
          <div className="mt-10 fade-in">

            {/* Summary Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-100">
                  Screening Results
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {results.length} candidate{results.length !== 1 ? 's' : ''} ranked by relevance
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {results[0] && (
                  <div className="glass-card px-4 py-2 border-emerald-500/20">
                    <span className="text-gray-500">Top match: </span>
                    <span className="font-semibold text-emerald-400">{results[0].score.toFixed(1)}%</span>
                    <span className="text-gray-500 ml-2 truncate max-w-[120px] inline-block align-bottom" title={results[0].name}>
                      — {results[0].name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label="Resume Screening Results">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-hover/50">
                      <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                        Rank
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Candidate File
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell w-64">
                        Match Strength
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-600">
                          No results to display.
                        </td>
                      </tr>
                    ) : (
                      results.map((result, idx) => (
                        <ResultRow
                          key={result.name}
                          result={result}
                          index={idx}
                          isExpanded={expandedResult === result.name}
                          onToggle={() => setExpandedResult(expandedResult === result.name ? null : result.name)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer note */}
              <div className="px-5 py-3.5 border-t border-surface-border bg-surface-hover/30 flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Click on any row to see detailed feedback. Scores are computed using TF-IDF vectorisation with bigrams and cosine similarity.
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-20 pt-8 border-t border-surface-border text-center space-y-1">
          <p className="text-sm text-gray-600">
            <span className="gradient-text font-semibold">SmartHire AI</span>
            {' · '}Built with Flask, Scikit-learn, and React
          </p>
          <p className="text-xs text-gray-700">
            B.Tech Project · Nevesh Divya · RA2311031010007 · SRM Institute of Science and Technology
          </p>
        </footer>

      </div>
    </div>
  )
}
