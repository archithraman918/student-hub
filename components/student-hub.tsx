"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  MapPin,
  Eye,
  EyeOff,
  BookOpen,
  Calendar,
  Coffee,
  Dumbbell,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

interface Assignment {
  id: number
  course: string
  title: string
  dueDate: string
  dueTime: string
}

interface Class {
  id: number
  course: string
  startTime: string
  endTime: string
  room: string
  dayOfWeek: string
}

interface Service {
  name: string
  openTime: string
  closeTime: string
}

interface StudentData {
  assignments: Assignment[]
  classes: Class[]
  services: Service[]
}

export default function StudentHub() {
  const [data, setData] = useState<StudentData | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/student-data.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })

    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading your student hub...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error loading student data</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{error || "Failed to load data"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get dates in local timezone to avoid timezone issues
  const now = new Date()
  const today = now.toLocaleDateString('en-CA') // YYYY-MM-DD format
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" })

  // Debug: Log current date information
  console.log('Current date info:', { today, tomorrow, currentDay })
  console.log('Available assignments:', data.assignments.map(a => ({ course: a.course, dueDate: a.dueDate })))
  console.log('Available classes:', data.classes.map(c => ({ course: c.course, day: c.dayOfWeek })))

  // Filter assignments due today and tomorrow
  const todayAssignments = data.assignments.filter((a) => a.dueDate === today)
  const tomorrowAssignments = data.assignments.filter((a) => a.dueDate === tomorrow)
  const nextAssignment = [...todayAssignments, ...tomorrowAssignments][0]

  console.log('Filtered assignments:', { todayAssignments, tomorrowAssignments, nextAssignment })

  // Filter today's classes and find next class
  const todayClasses = data.classes.filter((c) => c.dayOfWeek === currentDay)
  const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()

  console.log('Filtered classes:', { todayClasses, currentTimeMinutes })

  const remainingClasses = todayClasses.filter((c) => {
    const [hours, minutes] = c.startTime.split(":").map(Number)
    const classStartMinutes = hours * 60 + minutes
    return classStartMinutes > currentTimeMinutes
  })

  const nextClass = remainingClasses[0]

  const getServiceStatus = (service: Service) => {
    const [openHours, openMinutes] = service.openTime.split(":").map(Number)
    const [closeHours, closeMinutes] = service.closeTime.split(":").map(Number)
    const openMinutesTotal = openHours * 60 + openMinutes
    const closeMinutesTotal = closeHours * 60 + closeMinutes

    const isOpen = currentTimeMinutes >= openMinutesTotal && currentTimeMinutes < closeMinutesTotal

    return {
      isOpen,
      openTime: service.openTime,
      closeTime: service.closeTime,
    }
  }

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case "dining hall":
        return Coffee
      case "gym":
        return Dumbbell
      case "tutoring center":
        return GraduationCap
      default:
        return Coffee
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  if (focusMode) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Focus Mode
            </h1>
            <p className="text-muted-foreground mt-1">Your next priorities</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFocusMode(false)}
            className="flex items-center gap-2 hover:bg-accent/10"
          >
            <Eye className="h-4 w-4" />
            Show All
          </Button>
        </div>

        <div className="grid gap-6">
          {nextAssignment && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Next Due Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">{nextAssignment.course}</span>
                    <Badge
                      variant={nextAssignment.dueDate === today ? "destructive" : "secondary"}
                      className="text-sm px-3 py-1"
                    >
                      Due {nextAssignment.dueDate === today ? "Today" : "Tomorrow"}
                    </Badge>
                  </div>
                  <p className="text-foreground font-medium">{nextAssignment.title}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{nextAssignment.dueTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {nextClass && (
            <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Next Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="font-semibold text-lg">{nextClass.course}</div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      {formatTime(nextClass.startTime)} - {formatTime(nextClass.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{nextClass.room}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!nextAssignment && !nextClass && (
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">No urgent assignments or classes right now.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Today's Student Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFocusMode(true)}
            className="flex items-center gap-2 hover:bg-primary/10 hover:border-primary/30"
          >
            <EyeOff className="h-4 w-4" />
            Focus Mode
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 hover:bg-accent/10"
          >
            <Calendar className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-md border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            Assignments Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-red-900">{assignment.course}</span>
                  <Badge variant="destructive" className="font-medium">
                    Due Today
                  </Badge>
                </div>
                <p className="font-medium text-red-800 mb-2">{assignment.title}</p>
                <div className="flex items-center gap-2 text-red-700">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{assignment.dueTime}</span>
                </div>
              </div>
            ))}

            {tomorrowAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-900">{assignment.course}</span>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium">Due Tomorrow</Badge>
                </div>
                <p className="font-medium text-amber-800 mb-2">{assignment.title}</p>
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{assignment.dueTime}</span>
                </div>
              </div>
            ))}

            {todayAssignments.length === 0 && tomorrowAssignments.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No assignments due today or tomorrow</p>
                <p className="text-sm text-muted-foreground/70 mt-1">You're all caught up!</p>
                
                {/* Show all assignments for debugging */}
                <div className="mt-4 text-left">
                  <p className="text-sm font-medium text-muted-foreground mb-2">All assignments:</p>
                  {data.assignments.map((assignment) => (
                    <div key={assignment.id} className="text-xs text-muted-foreground/70 mb-1">
                      {assignment.course}: {assignment.title} (Due: {assignment.dueDate})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-l-4 border-l-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Calendar className="h-6 w-6 text-accent" />
            Today's Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {remainingClasses.length > 0 ? (
              remainingClasses.map((classItem, index) => (
                <div
                  key={classItem.id}
                  className={`p-4 rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${
                    index === 0
                      ? "border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{classItem.course}</span>
                    {index === 0 && <Badge className="bg-accent text-accent-foreground font-medium">Next Class</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{classItem.room}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No more classes today</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Time to focus on assignments or relax!</p>
                
                {/* Show all classes for debugging */}
                <div className="mt-4 text-left">
                  <p className="text-sm font-medium text-muted-foreground mb-2">All classes:</p>
                  {data.classes.map((classItem) => (
                    <div key={classItem.id} className="text-xs text-muted-foreground/70 mb-1">
                      {classItem.course}: {classItem.startTime}-{classItem.endTime} ({classItem.dayOfWeek})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-l-4 border-l-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Coffee className="h-6 w-6 text-secondary" />
            Campus Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {data.services.map((service) => {
              const status = getServiceStatus(service)
              const ServiceIcon = getServiceIcon(service.name)
              return (
                <div
                  key={service.name}
                  className={`p-4 rounded-xl border-2 shadow-sm transition-all ${
                    status.isOpen
                      ? "border-green-200 bg-gradient-to-r from-green-50 to-green-100/50 hover:shadow-md"
                      : "border-red-200 bg-gradient-to-r from-red-50 to-red-100/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ServiceIcon className={`h-5 w-5 ${status.isOpen ? "text-green-600" : "text-red-600"}`} />
                      <span className="font-bold text-lg">{service.name}</span>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-bold flex items-center gap-1 ${
                          status.isOpen ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {status.isOpen ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {status.isOpen ? "Open" : "Closed"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {status.isOpen
                          ? `Until ${formatTime(status.closeTime)}`
                          : `Opens ${formatTime(status.openTime)}`}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
