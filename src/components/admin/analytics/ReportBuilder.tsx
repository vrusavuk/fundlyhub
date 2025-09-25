import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  DollarSign, 
  Target,
  Clock,
  Filter,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalFundraisers: number;
  activeFundraisers: number;
  totalDonations: number;
  totalRaised: number;
  averageDonation: number;
  conversionRate: number;
  userGrowthRate: number;
  revenueGrowthRate: number;
}

interface ReportBuilderProps {
  data: AnalyticsData;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

interface CustomReport {
  name: string;
  sections: string[];
  dateRange: string;
  format: 'pdf' | 'excel' | 'csv';
  schedule?: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive',
    name: 'Executive Summary',
    description: 'High-level overview for leadership',
    sections: ['key-metrics', 'growth-trends', 'goals-progress'],
    frequency: 'weekly'
  },
  {
    id: 'financial',
    name: 'Financial Report',
    description: 'Detailed financial performance',
    sections: ['revenue-trends', 'donation-analytics', 'category-performance'],
    frequency: 'monthly'
  },
  {
    id: 'user-engagement',
    name: 'User Engagement',
    description: 'User behavior and platform usage',
    sections: ['user-metrics', 'engagement-trends', 'conversion-rates'],
    frequency: 'weekly'
  },
  {
    id: 'campaign-performance',
    name: 'Campaign Performance',
    description: 'Campaign success and fundraising metrics',
    sections: ['campaign-metrics', 'success-rates', 'category-breakdown'],
    frequency: 'monthly'
  }
];

const AVAILABLE_SECTIONS = [
  { id: 'key-metrics', name: 'Key Metrics Overview', icon: Target },
  { id: 'user-metrics', name: 'User Analytics', icon: Users },
  { id: 'revenue-trends', name: 'Revenue Trends', icon: DollarSign },
  { id: 'donation-analytics', name: 'Donation Analytics', icon: DollarSign },
  { id: 'campaign-metrics', name: 'Campaign Metrics', icon: Target },
  { id: 'growth-trends', name: 'Growth Trends', icon: Calendar },
  { id: 'engagement-trends', name: 'Engagement Trends', icon: Users },
  { id: 'conversion-rates', name: 'Conversion Rates', icon: Target },
  { id: 'success-rates', name: 'Success Rates', icon: CheckCircle },
  { id: 'category-breakdown', name: 'Category Breakdown', icon: Filter },
  { id: 'category-performance', name: 'Category Performance', icon: Target },
  { id: 'goals-progress', name: 'Goals Progress', icon: CheckCircle }
];

export function ReportBuilder({ data }: ReportBuilderProps) {
  const [customReport, setCustomReport] = useState<CustomReport>({
    name: '',
    sections: [],
    dateRange: '30d',
    format: 'pdf'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ReportTemplate[]>([]);
  const { toast } = useToast();

  const generateReport = async (template?: ReportTemplate) => {
    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportData = {
        generatedAt: new Date().toISOString(),
        template: template?.name || 'Custom Report',
        data: template ? 
          Object.fromEntries(
            template.sections.map(section => [
              section, 
              getAnalyticsForSection(section, data)
            ])
          ) : 
          Object.fromEntries(
            customReport.sections.map(section => [
              section, 
              getAnalyticsForSection(section, data)
            ])
          ),
        metadata: {
          dateRange: customReport.dateRange,
          format: customReport.format,
          totalSections: template ? template.sections.length : customReport.sections.length
        }
      };

      // Create downloadable file
      const filename = `${(template?.name || customReport.name || 'report').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      if (!template) {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        downloadFile(blob, `${filename}.json`);
      } else {
        // For PDF/Excel, we'd normally use a proper library, but for demo purposes:
        const csvContent = convertToCSV(reportData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        downloadFile(blob, `${filename}.csv`);
      }

      toast({
        title: 'Report Generated',
        description: `${template?.name || 'Custom report'} has been generated successfully`,
      });

    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const scheduleReport = (template: ReportTemplate) => {
    if (scheduledReports.find(r => r.id === template.id)) {
      setScheduledReports(prev => prev.filter(r => r.id !== template.id));
      toast({
        title: 'Report Unscheduled',
        description: `${template.name} has been removed from scheduled reports`,
      });
    } else {
      setScheduledReports(prev => [...prev, template]);
      toast({
        title: 'Report Scheduled',
        description: `${template.name} will be generated ${template.frequency}`,
      });
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getAnalyticsForSection = (sectionId: string, data: AnalyticsData): any => {
    switch (sectionId) {
      case 'key-metrics':
        return {
          totalUsers: data.totalUsers,
          totalRaised: data.totalRaised,
          activeCampaigns: data.activeFundraisers,
          conversionRate: data.conversionRate
        };
      case 'user-metrics':
        return {
          totalUsers: data.totalUsers,
          activeUsers: data.activeUsers,
          userGrowthRate: data.userGrowthRate
        };
      case 'revenue-trends':
      case 'donation-analytics':
        return {
          totalRaised: data.totalRaised,
          totalDonations: data.totalDonations,
          averageDonation: data.averageDonation,
          revenueGrowthRate: data.revenueGrowthRate
        };
      case 'campaign-metrics':
        return {
          totalFundraisers: data.totalFundraisers,
          activeFundraisers: data.activeFundraisers,
          successRate: Math.round((data.activeFundraisers / data.totalFundraisers) * 100)
        };
      default:
        return { message: `Data for ${sectionId} section` };
    }
  };

  const convertToCSV = (data: any): string => {
    const headers = ['Metric', 'Value'];
    const rows = Object.entries(data.data).flatMap(([section, sectionData]: [string, any]) => 
      Object.entries(sectionData).map(([key, value]) => [
        `${section} - ${key}`, 
        typeof value === 'number' ? value.toLocaleString() : value
      ])
    );
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  const toggleSection = (sectionId: string) => {
    setCustomReport(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(s => s !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Report Templates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORT_TEMPLATES.map((template) => {
            const isScheduled = scheduledReports.some(r => r.id === template.id);
            
            return (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {template.frequency}
                      </Badge>
                      {isScheduled && (
                        <Badge variant="default">
                          <Clock className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-2">Included Sections:</div>
                      <div className="flex flex-wrap gap-1">
                        {template.sections.map((sectionId) => {
                          const section = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
                          return (
                            <Badge key={sectionId} variant="secondary" className="text-xs">
                              {section?.name || sectionId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => generateReport(template)}
                        disabled={isGenerating}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isGenerating ? 'Generating...' : 'Generate Now'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => scheduleReport(template)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {isScheduled ? 'Unschedule' : 'Schedule'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Custom Report Builder */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Report Builder</h3>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Build Custom Report
            </CardTitle>
            <CardDescription>
              Create a personalized report with your selected metrics and sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select 
                  value={customReport.dateRange} 
                  onValueChange={(value) => setCustomReport(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Format</label>
                <Select 
                  value={customReport.format} 
                  onValueChange={(value: 'pdf' | 'excel' | 'csv') => 
                    setCustomReport(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={() => generateReport()}
                  disabled={isGenerating || customReport.sections.length === 0}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </div>

            {/* Section Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">Report Sections</label>
                <Badge variant="outline">
                  {customReport.sections.length} selected
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_SECTIONS.map((section) => {
                  const isSelected = customReport.sections.includes(section.id);
                  const Icon = section.icon;
                  
                  return (
                    <div
                      key={section.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleSection(section.id)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        className="mr-3"
                      />
                      <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm font-medium">{section.name}</span>
                    </div>
                  );
                })}
              </div>
              
              {customReport.sections.length === 0 && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select at least one section to include in your report.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports Status */}
      {scheduledReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>
              Reports that will be automatically generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scheduledReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <span className="font-medium">{report.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {report.frequency}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => scheduleReport(report)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}