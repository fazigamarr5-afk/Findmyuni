import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { useAuth } from "../context/AuthContext"
import { universityService, favoritesService } from "../services/api.service"
import { Chip, Button, Tab, Tabs, Box, Tooltip, IconButton } from "@mui/material"
import { MapOutlined, SchoolOutlined, CalendarMonthOutlined, AccountBalanceOutlined, ChevronRight, OpenInNew, StarOutline, StarBorderOutlined, WorkspacePremiumOutlined, HotelOutlined, MenuBookOutlined } from "@mui/icons-material"

const UniversityDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [university, setUniversity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    if (id) fetchUniversityDetails()
    else { setError("Invalid university ID"); setLoading(false) }
  }, [id])

  const fetchUniversityDetails = async () => {
    try {
      setLoading(true)
      const data = await universityService.getUniversity(id)
      if (!data) throw new Error("University not found")
      setUniversity(data)
      // Check if favorited
      if (currentUser) {
        const fav = await favoritesService.isFavorited(id)
        setIsFavorited(fav)
      }
    } catch (err) {
      setError("Failed to load university details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const programsData = useMemo(() => {
    if (!university?.programs || typeof university.programs !== "object") return null
    const p = university.programs
    const bs = p.BSPrograms || p.u || []
    const ms = p.MSPrograms || p.g || []
    const phd = p.PhDPrograms || p.d || []
    if (!bs.length && !ms.length && !phd.length) return null
    return { bs, ms, phd }
  }, [university?.programs])

  const scholarshipsData = useMemo(() => {
    if (!university?.scholarships) return null
    const sch = university.scholarships
    if (Array.isArray(sch) && sch.length > 0) return { type: "list", items: sch }
    if (!Array.isArray(sch) && typeof sch === "object") {
      const cats = [
        { key: "merit", label: "Merit-Based", color: "#16a34a", bg: "#f0fdf4", icon: "⭐" },
        { key: "need_based", label: "Need-Based", color: "#2563eb", bg: "#eff6ff", icon: "❤️" },
        { key: "government", label: "Government", color: "#9333ea", bg: "#faf5ff", icon: "🏛️" },
        { key: "international", label: "International", color: "#ea580c", bg: "#fff7ed", icon: "🌍" },
      ]
      const active = cats.filter(c => sch[c.key] && sch[c.key].length > 0)
      if (active.length === 0) return null
      return { type: "categorized", categories: active, data: sch }
    }
    return null
  }, [university?.scholarships])

  const facilitiesList = useMemo(() => {
    if (!university?.facilities) return []
    const fac = university.facilities
    if (Array.isArray(fac)) return fac
    if (typeof fac === "object") {
      const list = []
      Object.values(fac).forEach(v => {
        if (Array.isArray(v)) list.push(...v)
        else if (typeof v === "string") list.push(v)
      })
      return list
    }
    return []
  }, [university?.facilities])

  const handleFavoriteClick = async () => {
    if (!currentUser) {
      navigate("/login", { state: { from: `/universities/${id}` } })
      return
    }
    try {
      if (isFavorited) {
        await favoritesService.removeFavorite(id)
        setIsFavorited(false)
      } else {
        await favoritesService.addFavorite(id)
        setIsFavorited(true)
      }
    } catch (e) {
      console.error("Favorite error:", e)
    }
  }

  const handleApplyClick = () => {
    if (university?.apply_link) {
      window.open(university.apply_link, "_blank")
    } else if (currentUser) {
      navigate(`/apply/${id}`)
    } else {
      navigate("/login", { state: { from: `/universities/${id}` } })
    }
  }

  const formatDate = (d) => {
    if (!d) return null
    try { return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) } catch { return d }
  }

  const getDeadlineInfo = () => {
    const raw = university?.deadline || university?.basic_info?.["Deadline to Apply"]
    if (!raw) return null
    try {
      const date = new Date(raw)
      const now = new Date()
      const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
      return { date, formatted: formatDate(raw), daysLeft: diff, isPast: diff < 0, isSoon: diff >= 0 && diff <= 14 }
    } catch { return { formatted: raw, daysLeft: null } }
  }

  const getInitials = (name) => {
    return name.split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("").toUpperCase()
  }

  const colors = ["#16a34a", "#2563eb", "#9333ea", "#ea580c", "#dc2626", "#0891b2"]
  const avatarColor = colors[Math.abs(id?.charCodeAt(0) || 0) % colors.length]

  const rankingsData = useMemo(() => {
    const rk = university?.basic_info?.rankings
    if (!rk || typeof rk !== "object") return null
    if (Object.keys(rk).length === 0) return null
    return rk
  }, [university?.basic_info])

  const logoUrl = university?.basic_info?.logo_url || null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading university details...</p>
        </div>
      </div>
    )
  }

  if (error || !university) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-6xl mb-4">🏫</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">{error || "University not found"}</h2>
        <button onClick={() => navigate("/universities")} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Browse All Universities
        </button>
      </div>
    )
  }

  const deadline = getDeadlineInfo()
  const bi = university.basic_info || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{university.name} - Programs, Rankings & Admissions | FindMyUni</title>
        <meta name="description" content={`${university.name} in ${bi.Location || 'Pakistan'}. ${programsData ? programsData.bs.length + programsData.ms.length + programsData.phd.length + ' programs' : ''} across BS, MS, PhD. ${rankingsData?.national ? 'Ranked #' + rankingsData.national + ' in Pakistan.' : ''} ${bi.Sector || ''} university. Admissions open now.`} />
        <meta property="og:title" content={`${university.name} - FindMyUni`} />
        <meta property="og:description" content={`${university.name} in ${bi.Location || 'Pakistan'}. Programs, rankings, scholarships and admission details.`} />
        <link rel="canonical" href={`https://findmyuni.pk/universities/${id}`} />
      </Helmet>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden" style={{ backgroundColor: logoUrl ? "white" : "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
              {logoUrl ? (
                <img src={logoUrl} alt={university.name} className="w-full h-full object-contain p-1" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              ) : null}
              <div className={`text-3xl md:text-4xl font-bold ${logoUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full text-white`} style={{ display: logoUrl ? 'none' : 'flex' }}>
                {getInitials(university.name)}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-4xl font-bold mb-3 leading-tight flex-1">{university.name}</h1>
                <Tooltip title={isFavorited ? "Remove from favorites" : "Add to favorites"}>
                  <IconButton onClick={handleFavoriteClick} sx={{ color: isFavorited ? "#f59e0b" : "rgba(255,255,255,0.7)", mb: 2 }}>
                    {isFavorited ? <StarOutline sx={{ fontSize: 32 }} /> : <StarBorderOutlined sx={{ fontSize: 32 }} />}
                  </IconButton>
                </Tooltip>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-white/20 backdrop-blur-sm">
                  <MapOutlined fontSize="small" /> {university.location || bi.Location || "Pakistan"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-white/20 backdrop-blur-sm">
                  <AccountBalanceOutlined fontSize="small" /> {university.sector || bi.Sector || "University"}
                </span>
                {university.admissionOpen && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-green-400 text-green-900 font-semibold">
                    ● Admissions Open
                  </span>
                )}
              </div>
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-green-100">
                {bi.student_count && <span>👨‍🎓 {bi.student_count} Students</span>}
                {rankingsData?.world_qs && <span>🏆 QS World #{rankingsData.world_qs}</span>}
                {rankingsData?.world_times && <span>🌍 Times #{rankingsData.world_times}</span>}
                {rankingsData?.national && <span>🇵🇰 #{rankingsData.national} in Pakistan</span>}
                {rankingsData?.hec && <span>🏛️ HEC {rankingsData.hec} Category</span>}
                {bi.national_rank_badge && !rankingsData?.national && <span>🏅 {bi.national_rank_badge}</span>}
                {programsData && <span>📚 {programsData.bs.length + programsData.ms.length + programsData.phd.length} Programs</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deadline Banner */}
      {deadline && (
        <div className={`px-4 py-3 ${deadline.isPast ? "bg-red-50 border-b border-red-200" : deadline.isSoon ? "bg-amber-50 border-b border-amber-200" : "bg-blue-50 border-b border-blue-200"}`}>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarMonthOutlined className={deadline.isPast ? "text-red-500" : deadline.isSoon ? "text-amber-500" : "text-blue-500"} />
              <span className="font-medium text-gray-800">Application Deadline: {deadline.formatted}</span>
            </div>
            {deadline.daysLeft !== null && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${deadline.isPast ? "bg-red-100 text-red-700" : deadline.isSoon ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                {deadline.isPast ? "Deadline Passed" : `${deadline.daysLeft} days left`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            {university.description && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <SchoolOutlined className="text-green-600" /> About {university.name}
                </h2>
                <p className="text-gray-600 leading-relaxed">{university.description}</p>
              </section>
            )}

            {/* Programs */}
            {programsData && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-5 pb-0">
                  <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <MenuBookOutlined className="text-green-600" /> Programs Offered
                  </h2>
                  <p className="text-sm text-gray-500 mb-3">{programsData.bs.length + programsData.ms.length + programsData.phd.length} programs across all levels</p>
                </div>
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  sx={{ px: 2, borderBottom: 1, borderColor: "divider", minHeight: 44 }}
                >
                  <Tab label={`BS (${programsData.bs.length})`} sx={{ minHeight: 44, textTransform: "none", fontWeight: 600 }} />
                  <Tab label={`MS (${programsData.ms.length})`} sx={{ minHeight: 44, textTransform: "none", fontWeight: 600 }} />
                  <Tab label={`PhD (${programsData.phd.length})`} sx={{ minHeight: 44, textTransform: "none", fontWeight: 600 }} />
                </Tabs>
                <Box sx={{ p: 3 }}>
                  {activeTab === 0 && programsData.bs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {programsData.bs.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 transition">
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{typeof p === "string" ? p : p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 1 && programsData.ms.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {programsData.ms.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50/80 hover:bg-green-100 transition">
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{typeof p === "string" ? p : p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 2 && programsData.phd.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {programsData.phd.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50/80 hover:bg-purple-100 transition">
                          <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{typeof p === "string" ? p : p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {((activeTab === 0 && !programsData.bs.length) || (activeTab === 1 && !programsData.ms.length) || (activeTab === 2 && !programsData.phd.length)) && (
                    <p className="text-gray-400 text-center py-8">No programs at this level</p>
                  )}
                </Box>
              </section>
            )}

            {/* Scholarships */}
            {scholarshipsData && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <WorkspacePremiumOutlined className="text-green-600" /> Scholarships
                </h2>
                {scholarshipsData.type === "list" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scholarshipsData.items.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition">
                        <span className="text-lg">🎓</span>
                        <span className="text-sm text-gray-700">{typeof s === "string" ? s : s.name || JSON.stringify(s)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {scholarshipsData.type === "categorized" && (
                  <div className="space-y-5">
                    {scholarshipsData.categories.map(({ key, label, color, bg, icon }) => (
                      <div key={key}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{icon}</span>
                          <h3 className="font-semibold text-sm" style={{ color }}>{label}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: bg, color }}>{scholarshipsData.data[key].length}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {scholarshipsData.data[key].map((s, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition text-sm text-gray-700">
                              <ChevronRight fontSize="small" style={{ color }} />
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Rankings */}
            {rankingsData && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <WorkspacePremiumOutlined className="text-green-600" /> University Rankings
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {rankingsData.world_qs && (
                    <div className="text-center p-4 rounded-xl bg-gradient-to-b from-amber-50 to-white border border-amber-100">
                      <div className="text-2xl font-bold text-amber-600">#{rankingsData.world_qs}</div>
                      <div className="text-xs text-gray-500 mt-1">QS World</div>
                    </div>
                  )}
                  {rankingsData.world_times && (
                    <div className="text-center p-4 rounded-xl bg-gradient-to-b from-blue-50 to-white border border-blue-100">
                      <div className="text-2xl font-bold text-blue-600">#{rankingsData.world_times}</div>
                      <div className="text-xs text-gray-500 mt-1">Times Higher</div>
                    </div>
                  )}
                  {rankingsData.national && (
                    <div className="text-center p-4 rounded-xl bg-gradient-to-b from-green-50 to-white border border-green-100">
                      <div className="text-2xl font-bold text-green-600">#{rankingsData.national}</div>
                      <div className="text-xs text-gray-500 mt-1">National</div>
                    </div>
                  )}
                  {rankingsData.hec && (
                    <div className="text-center p-4 rounded-xl bg-gradient-to-b from-purple-50 to-white border border-purple-100">
                      <div className="text-lg font-bold text-purple-600">{rankingsData.hec}</div>
                      <div className="text-xs text-gray-500 mt-1">HEC Category</div>
                    </div>
                  )}
                </div>
                {rankingsData.prog && Object.keys(rankingsData.prog).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Program Rankings</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(rankingsData.prog).map(([prog, rank]) => (
                        <div key={prog} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                          <span className="text-sm text-gray-700">{prog}</span>
                          <span className="text-sm font-bold text-green-600">#{rank}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Facilities */}
            {facilitiesList.length > 0 && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <HotelOutlined className="text-green-600" /> Campus Facilities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {facilitiesList.map((f, i) => (
                    <span key={i} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-green-50 hover:border-green-200 transition">
                      {f}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <button
                onClick={handleApplyClick}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {university.apply_link ? "Apply Now →" : "Start Application →"}
              </button>
              {university.apply_link && (
                <a href={university.apply_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 mt-3 text-sm text-blue-600 hover:underline">
                  <OpenInNew fontSize="small" /> Visit Official Website
                </a>
              )}

              {/* Info Table */}
              <div className="mt-6 space-y-3">
                <InfoRow icon={<MapOutlined />} label="Location" value={university.location || bi.Location || "Pakistan"} />
                <InfoRow icon={<AccountBalanceOutlined />} label="Sector" value={university.sector || bi.Sector || "N/A"} />
                {bi.Province && <InfoRow icon={<MapOutlined />} label="Province" value={bi.Province} />}
                {bi.Contact && <InfoRow icon={<span>📧</span>} label="Contact" value={bi.Contact} />}
                {bi.admission_fee && <InfoRow icon={<span>💰</span>} label="Admission Fee" value={bi.admission_fee} />}
                {bi.student_count && <InfoRow icon={<span>👨‍🎓</span>} label="Students" value={bi.student_count} />}
                {bi.undergraduate_per_semester && <InfoRow icon={<span>📋</span>} label="UG/Semester" value={bi.undergraduate_per_semester} />}
                {bi.graduate_per_semester && <InfoRow icon={<span>📋</span>} label="Grad/Semester" value={bi.graduate_per_semester} />}
              </div>

              {/* Quick Links */}
              {(university.url || university.apply_link) && (
                <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Links</h3>
                  {university.url && (
                    <a href={university.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-green-50 text-sm text-gray-700 transition">
                      <OpenInNew fontSize="small" /> Visit Website
                    </a>
                  )}
                  {university.apply_link && (
                    <a href={university.apply_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-green-50 text-sm text-gray-700 transition">
                      <ChevronRight fontSize="small" /> Apply Online
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Back */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <button onClick={() => navigate("/universities")} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition">
          ← Back to All Universities
        </button>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <span className="text-gray-400">{icon}</span> {label}
      </div>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

export default UniversityDetail
