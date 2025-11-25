"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check } from "lucide-react"

const steps = [
  { id: 1, title: "Client Information" },
  { id: 2, title: "Contact Details" },
  { id: 3, title: "Account Manager" },
  { id: 4, title: "Initial Project" },
]

export default function ClientOnboardPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client: {
      name: "",
      industry: "",
      website: "",
      phone: "",
      email: "",
      address: "",
    },
    contacts: [{ first_name: "", last_name: "", email: "", phone: "", job_title: "", is_primary: true }],
    accountManagerId: "",
    project: {
      name: "",
      code: "",
      status: "planning",
      priority: "medium",
      start_date: "",
      end_date: "",
      budget: "",
      description: "",
    },
    projectManagerId: "",
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { getStoredToken } = await import("@/lib/utils/storage")
      const token = getStoredToken()

      const response = await fetch("/api/clients/onboard", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client: formData.client,
          contacts: formData.contacts.filter((c) => c.first_name && c.last_name),
          accountManagerId: parseInt(formData.accountManagerId),
          project: formData.project.name ? formData.project : null,
          projectManagerId: formData.projectManagerId ? parseInt(formData.projectManagerId) : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to onboard client")
      }

      router.push("/clients")
    } catch (error) {
      console.error("Error onboarding client:", error)
      setLoading(false)
    }
  }

  const progress = (currentStep / steps.length) * 100

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/clients")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Client Onboarding</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Step {currentStep} of {steps.length}
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  value={formData.client.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, name: e.target.value },
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.client.industry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, industry: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.client.website}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, website: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.client.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, phone: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.client.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, email: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.client.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, address: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              {formData.contacts.map((contact, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={contact.first_name}
                        onChange={(e) => {
                          const newContacts = [...formData.contacts]
                          newContacts[index].first_name = e.target.value
                          setFormData({ ...formData, contacts: newContacts })
                        }}
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        value={contact.last_name}
                        onChange={(e) => {
                          const newContacts = [...formData.contacts]
                          newContacts[index].last_name = e.target.value
                          setFormData({ ...formData, contacts: newContacts })
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => {
                        const newContacts = [...formData.contacts]
                        newContacts[index].email = e.target.value
                        setFormData({ ...formData, contacts: newContacts })
                      }}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => {
                        const newContacts = [...formData.contacts]
                        newContacts[index].phone = e.target.value
                        setFormData({ ...formData, contacts: newContacts })
                      }}
                    />
                  </div>
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      value={contact.job_title}
                      onChange={(e) => {
                        const newContacts = [...formData.contacts]
                        newContacts[index].job_title = e.target.value
                        setFormData({ ...formData, contacts: newContacts })
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    ...formData,
                    contacts: [
                      ...formData.contacts,
                      { first_name: "", last_name: "", email: "", phone: "", job_title: "", is_primary: false },
                    ],
                  })
                }}
              >
                Add Another Contact
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountManager">Account Manager *</Label>
                <Input
                  id="accountManager"
                  type="number"
                  placeholder="User ID"
                  value={formData.accountManagerId}
                  onChange={(e) =>
                    setFormData({ ...formData, accountManagerId: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the user ID of the account manager
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={formData.project.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, name: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="projectCode">Project Code</Label>
                <Input
                  id="projectCode"
                  value={formData.project.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, code: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="projectManager">Project Manager</Label>
                <Input
                  id="projectManager"
                  type="number"
                  placeholder="User ID"
                  value={formData.projectManagerId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectManagerId: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.project.start_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, start_date: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.project.end_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, end_date: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.project.budget}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, budget: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < steps.length ? (
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                disabled={
                  (currentStep === 1 && !formData.client.name) ||
                  (currentStep === 3 && !formData.accountManagerId)
                }
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Onboarding..." : "Complete Onboarding"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

