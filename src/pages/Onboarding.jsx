import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  ArrowRight, 
  Zap,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    industry: 'services',
    timezone: 'America/Sao_Paulo',
    business_hours_start: '09:00',
    business_hours_end: '18:00'
  });

  useEffect(() => {
    checkExistingCompany();
  }, []);

  const checkExistingCompany = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        // User already has a company, redirect to dashboard
        navigate(createPageUrl('Dashboard'));
      }
    } catch (error) {
      console.error('Error checking company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!companyData.name) return;
    
    setSaving(true);
    try {
      const user = await base44.auth.me();
      
      // Create company
      const company = await base44.entities.Company.create({
        ...companyData,
        ai_enabled: true,
        status: 'trial'
      });

      // Add user as company admin
      await base44.entities.TeamMember.create({
        company_id: company.id,
        user_email: user.email,
        role: 'company_admin',
        status: 'active'
      });

      // Create default AI flow
      await base44.entities.AIConversationFlow.create({
        company_id: company.id,
        name: 'Default Flow',
        description: 'Standard greeting and qualification flow',
        greeting_message: `Hi there! 👋 Thanks for reaching out to ${companyData.name}. I'm your AI assistant and I'd love to help you today. What can I assist you with?`,
        outside_hours_message: `Thanks for your message! Our team is currently offline but we'll get back to you as soon as we're back. In the meantime, feel free to leave your question and we'll respond promptly!`,
        handoff_message: `Great! I'm connecting you with one of our specialists who can provide more detailed assistance. They'll be with you shortly!`,
        hot_lead_threshold: 80,
        warm_lead_threshold: 50,
        is_default: true,
        is_active: true
      });

      setStep(3);
      
      // Redirect to dashboard after animation
      setTimeout(() => {
        navigate(createPageUrl('Dashboard'));
      }, 2000);
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">LeadFlow AI</span>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                s === step ? "bg-indigo-600 w-8" : 
                s < step ? "bg-indigo-600" : "bg-slate-200"
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl">Welcome to LeadFlow AI</CardTitle>
              <CardDescription className="text-base">
                Let's set up your company to start capturing and managing leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  placeholder="Your Company Name"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Industry</Label>
                <Select
                  value={companyData.industry}
                  onValueChange={(value) => setCompanyData({ ...companyData, industry: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthcare">Healthcare / Clinics</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="services">Professional Services</SelectItem>
                    <SelectItem value="retail">Retail / E-commerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => setStep(2)}
                disabled={!companyData.name}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Business Hours</CardTitle>
              <CardDescription className="text-base">
                When is your team available to respond?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={companyData.timezone}
                  onValueChange={(value) => setCompanyData({ ...companyData, timezone: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                    <SelectItem value="America/New_York">New York (EST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Opens at</Label>
                  <Input
                    type="time"
                    value={companyData.business_hours_start}
                    onChange={(e) => setCompanyData({ ...companyData, business_hours_start: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Closes at</Label>
                  <Input
                    type="time"
                    value={companyData.business_hours_end}
                    onChange={(e) => setCompanyData({ ...companyData, business_hours_end: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleCreateCompany}
                  disabled={saving}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Company
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-0 shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all set!</h2>
              <p className="text-slate-500 mb-6">
                Your company has been created. Redirecting you to your dashboard...
              </p>
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}