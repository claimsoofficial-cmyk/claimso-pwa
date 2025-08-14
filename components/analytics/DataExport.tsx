'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ExportData {
  products: any[];
  warranties: any[];
  analytics: any;
  claims: any[];
}

interface DataExportProps {
  data: ExportData;
  onExport?: (format: string, data: any) => void;
}

export default function DataExport({ data, onExport }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('');

  const exportFormats = [
    {
      id: 'json',
      name: 'JSON',
      description: 'Complete data in JSON format',
      icon: FileJson,
      color: 'bg-yellow-100 text-yellow-700'
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Spreadsheet format for Excel/Google Sheets',
      icon: FileSpreadsheet,
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Formatted report with charts and insights',
      icon: FileText,
      color: 'bg-red-100 text-red-700'
    }
  ];

  const exportData = async (format: string) => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      switch (format) {
        case 'json':
          await exportAsJSON(data);
          break;
        case 'csv':
          await exportAsCSV(data);
          break;
        case 'pdf':
          await exportAsPDF(data);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      toast.success(`Data exported successfully as ${format.toUpperCase()}`);
      onExport?.(format, data);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  const exportAsJSON = async (data: ExportData) => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      data: data
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `claimso-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = async (data: ExportData) => {
    // Export products as CSV
    const productsCSV = convertToCSV(data.products, 'products');
    downloadCSV(productsCSV, 'claimso-products.csv');

    // Export warranties as CSV
    const warrantiesCSV = convertToCSV(data.warranties, 'warranties');
    downloadCSV(warrantiesCSV, 'claimso-warranties.csv');

    // Export analytics summary
    const analyticsCSV = convertAnalyticsToCSV(data.analytics);
    downloadCSV(analyticsCSV, 'claimso-analytics.csv');
  };

  const exportAsPDF = async (data: ExportData) => {
    // For now, we'll create a simple HTML report that can be printed
    const reportHTML = generateReportHTML(data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const convertToCSV = (data: any[], type: string): string => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const convertAnalyticsToCSV = (analytics: any): string => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Spent', `$${analytics.totalSpent?.toLocaleString() || 0}`],
      ['Total Products', analytics.totalProducts || 0],
      ['Active Warranties', analytics.activeWarranties || 0],
      ['Expiring Warranties', analytics.expiringWarranties || 0],
      ['Warranty Coverage %', `${Math.round((analytics.warrantyCoverage?.covered / analytics.totalProducts) * 100) || 0}%`],
      ['Average Product Value', `$${Math.round(analytics.totalSpent / analytics.totalProducts) || 0}`]
    ];

    return rows.map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateReportHTML = (data: ExportData): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Claimso Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .metric-label { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Claimso Analytics Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2>Summary</h2>
            <div class="metric">
              <div class="metric-value">$${data.analytics?.totalSpent?.toLocaleString() || 0}</div>
              <div class="metric-label">Total Spent</div>
            </div>
            <div class="metric">
              <div class="metric-value">${data.analytics?.totalProducts || 0}</div>
              <div class="metric-label">Total Products</div>
            </div>
            <div class="metric">
              <div class="metric-value">${data.analytics?.activeWarranties || 0}</div>
              <div class="metric-label">Active Warranties</div>
            </div>
            <div class="metric">
              <div class="metric-value">${Math.round((data.analytics?.warrantyCoverage?.covered / data.analytics?.totalProducts) * 100) || 0}%</div>
              <div class="metric-label">Warranty Coverage</div>
            </div>
          </div>

          <div class="section">
            <h2>Products</h2>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Purchase Price</th>
                  <th>Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                ${data.products?.map(product => `
                  <tr>
                    <td>${product.product_name || ''}</td>
                    <td>${product.brand || ''}</td>
                    <td>${product.category || ''}</td>
                    <td>$${product.purchase_price?.toLocaleString() || 0}</td>
                    <td>${product.purchase_date ? new Date(product.purchase_date).toLocaleDateString() : ''}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Report generated by Claimso - Smart Warranty Management</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Data
        </CardTitle>
        <p className="text-sm text-gray-600">
          Download your data in various formats for backup or analysis
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Export Format Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exportFormats.map((format) => {
              const Icon = format.icon;
              const isExporting = exportFormat === format.id;
              
              return (
                <div
                  key={format.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                    isExporting ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => !isExporting && exportData(format.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${format.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{format.name}</h3>
                      <p className="text-sm text-gray-600">{format.description}</p>
                    </div>
                    {isExporting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export Status */}
          {isExporting && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-800">
                Exporting data as {exportFormat.toUpperCase()}...
              </span>
            </div>
          )}

          {/* Data Summary */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Data Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {data.products?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Products</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {data.warranties?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Warranties</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {data.claims?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Claims</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  ${data.analytics?.totalSpent?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-600">Total Value</div>
              </div>
            </div>
          </div>

          {/* Export Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Export Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• JSON format includes all data for backup purposes</li>
                  <li>• CSV format is best for spreadsheet analysis</li>
                  <li>• PDF reports are formatted for sharing and printing</li>
                  <li>• Exports include data as of the current date</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
