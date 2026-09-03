"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { universityService } from "../services/api.service"
import { Chip } from "@mui/material"

const UniversityDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [university, setUniversity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchUniversityDetails()
    } else {
      setError("Invalid university ID")
      setLoading(false)
    }
  }, [id])

  const fetchUniversityDetails = async () => {
    try {
      setLoading(true)
      const data = await universityService.getUniversity(id)
      if (!data) {
        throw new Error("University not found")
      }
      setUniversity(data)
    } catch (err) {
      setError("Failed to fetch university details: " + (err.message || "Unknown error"))
      console.error("Error fetching university:", err)
    } finally {
      setLoading(false)
    }
  }

  // Pre-compute programs, scholarships, facilities to avoid IIFE in JSX
  const programsData = useMemo(() => {
    if (!university?.programs || typeof university.programs !== "object") return null
    const p = university.programs
    const bs = p.BSPrograms || p.u || []
    const ms = p.MSPrograms || p.g || []
    const phd = p.PhDPrograms || p.d || []
    if (bs.length === 0 && ms.length === 0 && phd.length === 0) return null
    return { bs, ms, phd }
  }, [university?.programs])

  const scholarshipsData = useMemo(() => {
    if (!university?.scholarships) return null
    const sch = university.scholarships
    if (Array.isArray(sch) && sch.length > 0) return { type: "list", items: sch }
    if (!Array.isArray(sch) && typeof sch === "object") {
      const categories = [
        { key: "merit", label: "Merit-Based Scholarships", color: "blue" },
        { key: "need_based", label: "Need-Based Scholarships", color: "green" },
        { key: "government", label: "Government Scholarships", color: "purple" },
        { key: "international", label: "International Scholarships", color: "orange" },
      ]
      const active = categories.filter(c => sch[c.key] && sch[c.key].length > 0)
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

  const handleApplyClick = () => {
    if (university && university.apply_link) {
      window.open(university.apply_link, '_blank');
    } else {
      if (currentUser) {
        navigate(`/apply/${id}`);
      } else {
        navigate("/login", { state: { from: `/universities/${id}` } });
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Contact university"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate("/universities")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Universities
        </button>
      </div>
    )
  }

  if (!university) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-gray-500 mb-4">University not found</div>
        <button
          onClick={() => navigate("/universities")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Universities
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="lg:container px-4 w-full lg:grid lg:grid-cols-12">
        <div className="University_Data lg:col-span-9 mt-12 flex flex-col gap-8 mb-12">
          <div className="text-center">
            <h1 className="max-sm:text-base sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-2">
              {university.name}
            </h1>
            {university.admissionOpen && (
              <Chip
                label="Admission Open"
                color="success"
                size="medium"
                sx={{ fontWeight: 'medium' }}
              />
            )}
          </div>

          <div className="w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] border mx-auto">
            <table className="min-w-full border-collapse border border-primary text-primary font-semibold">
              <tbody>
                <tr>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">Location</td>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    {university.location || (university.basic_info && university.basic_info.Location) || "Not specified"}
                    {university.province ? `, ${university.province}` : ""}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">Sector</td>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    {university.sector || (university.basic_info && university.basic_info.Sector) || "Not specified"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">Affiliation</td>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    {university.affiliation || (university.basic_info && university.basic_info.Affiliation) || "Not specified"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">Deadline to Apply</td>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg text-red-600 font-semibold">
                    {formatDate(university.deadline || (university.basic_info && university.basic_info["Deadline to Apply"]))}
                  </td>
                </tr>
                {university.ranking && (
                  <tr>
                    <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-gray-400 text-center max-sm:text-xs md:text-base lg:text-lg">Ranking</td>
                    <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-gray-400 text-center max-sm:text-xs md:text-base lg:text-lg">{university.ranking}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* University Description */}
          {university.description && (
            <div className="mt-8 w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] mx-auto">
              <h2 className="text-xl font-bold mb-4">About {university.name}</h2>
              <p className="text-gray-700">{university.description}</p>
            </div>
          )}

          {/* Programs Section */}
          {programsData && (
            <div className="mt-8 w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] mx-auto">
              <h2 className="text-xl font-bold mb-4">Available Programs</h2>
              {programsData.bs.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-blue-700">BS / Undergraduate Programs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {programsData.bs.map((program, index) => (
                      <div key={index} className="p-3 border rounded-lg hover:bg-blue-50">
                        <h4 className="font-medium text-sm">{typeof program === "string" ? program : program.name || JSON.stringify(program)}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {programsData.ms.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-green-700">MS / Graduate Programs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {programsData.ms.map((program, index) => (
                      <div key={index} className="p-3 border rounded-lg hover:bg-green-50">
                        <h4 className="font-medium text-sm">{typeof program === "string" ? program : program.name || JSON.stringify(program)}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {programsData.phd.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-purple-700">PhD / Doctoral Programs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {programsData.phd.map((program, index) => (
                      <div key={index} className="p-3 border rounded-lg hover:bg-purple-50">
                        <h4 className="font-medium text-sm">{typeof program === "string" ? program : program.name || JSON.stringify(program)}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scholarships Section */}
          {scholarshipsData && (
            <div className="mt-8 w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] mx-auto">
              <h2 className="text-xl font-bold mb-4">Scholarships</h2>
              {scholarshipsData.type === "list" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scholarshipsData.items.map((s, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-yellow-50">
                      <span className="font-medium text-sm">{typeof s === "string" ? s : JSON.stringify(s)}</span>
                    </div>
                  ))}
                </div>
              )}
              {scholarshipsData.type === "categorized" && scholarshipsData.categories.map(({ key, label, color }) => (
                <div key={key} className="mb-4">
                  <h3 className={`text-lg font-semibold mb-2`}>{label}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {scholarshipsData.data[key].map((s, i) => (
                      <div key={i} className="p-2 border rounded bg-gray-50 text-sm">{s}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Facilities Section */}
          {facilitiesList.length > 0 && (
            <div className="mt-8 w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] mx-auto">
              <h2 className="text-xl font-bold mb-4">Facilities</h2>
              <div className="flex flex-wrap gap-2">
                {facilitiesList.map((f, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 border rounded-full text-sm">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button */}
          <div className="mt-8 w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] mx-auto text-center">
            <button
              onClick={handleApplyClick}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-bold"
            >
              Apply Now
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 mt-12"></div>
      </div>
    </div>
  )
}

export default UniversityDetail
