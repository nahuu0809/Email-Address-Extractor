"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { ValidationSettings as ValidationSettingsType } from "@/components/email-extractor-unified"

interface ValidationSettingsProps {
  settings: ValidationSettingsType
  onSettingsChange: (settings: ValidationSettingsType) => void
}

export default function ValidationSettings({ settings, onSettingsChange }: ValidationSettingsProps) {
  const [localSettings, setLocalSettings] = useState<ValidationSettingsType>(settings)

  const updateSetting = <K extends keyof ValidationSettingsType>(key: K, value: ValidationSettingsType[K]) => {
    setLocalSettings((prev) => {
      const updated = { ...prev, [key]: value }
      onSettingsChange(updated)
      return updated
    })
  }

  const resetToDefaults = () => {
    const defaults: ValidationSettingsType = {
      scoreThreshold: 70,
      checkMxRecords: true,
      checkDisposable: true,
      performRiskAssessment: true,
      fetchCompanyInfo: true,
      checkEmailActivity: true,
      validationTimeout: 30,
    }

    setLocalSettings(defaults)
    onSettingsChange(defaults)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Validity Threshold Score</Label>
          <span className="text-sm font-medium">{localSettings.scoreThreshold}%</span>
        </div>
        <Slider
          value={[localSettings.scoreThreshold]}
          onValueChange={(value) => updateSetting("scoreThreshold", value[0])}
          min={0}
          max={100}
          step={5}
        />
        <p className="text-xs text-muted-foreground">Emails with scores above this threshold are considered valid</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Validation Steps</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="check-mx">MX Record Checking</Label>
            <p className="text-xs text-muted-foreground">Verify domain has valid mail exchanger records</p>
          </div>
          <Switch
            id="check-mx"
            checked={localSettings.checkMxRecords}
            onCheckedChange={(checked) => updateSetting("checkMxRecords", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="check-disposable">Disposable Email Detection</Label>
            <p className="text-xs text-muted-foreground">Check if email uses a temporary/disposable service</p>
          </div>
          <Switch
            id="check-disposable"
            checked={localSettings.checkDisposable}
            onCheckedChange={(checked) => updateSetting("checkDisposable", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="risk-assessment">Risk Assessment</Label>
            <p className="text-xs text-muted-foreground">Analyze for suspicious patterns and risk factors</p>
          </div>
          <Switch
            id="risk-assessment"
            checked={localSettings.performRiskAssessment}
            onCheckedChange={(checked) => updateSetting("performRiskAssessment", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="company-info">Company Information</Label>
            <p className="text-xs text-muted-foreground">Retrieve company details for business domains</p>
          </div>
          <Switch
            id="company-info"
            checked={localSettings.fetchCompanyInfo}
            onCheckedChange={(checked) => updateSetting("fetchCompanyInfo", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-activity">Email Activity Check</Label>
            <p className="text-xs text-muted-foreground">Check for signs of email account activity</p>
          </div>
          <Switch
            id="email-activity"
            checked={localSettings.checkEmailActivity}
            onCheckedChange={(checked) => updateSetting("checkEmailActivity", checked)}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="timeout">Validation Timeout (seconds)</Label>
        <Input
          id="timeout"
          type="number"
          min={5}
          max={300}
          value={localSettings.validationTimeout}
          onChange={(e) => updateSetting("validationTimeout", Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">Maximum time for validation process, 0 for unlimited</p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
