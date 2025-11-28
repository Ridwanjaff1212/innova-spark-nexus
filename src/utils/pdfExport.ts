// PDF Export utility using browser's print functionality
// This creates a properly formatted PDF report

interface ReportData {
  title: string;
  subtitle?: string;
  sections: {
    heading: string;
    items: { label: string; value: string | number }[];
  }[];
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
}

export function generatePDFReport(data: ReportData, filename: string) {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to download PDF");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', system-ui, sans-serif; 
          padding: 40px; 
          color: #1a1a2e;
          background: white;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding-bottom: 20px;
          border-bottom: 3px solid #4C6FFF;
        }
        .logo { font-size: 32px; margin-bottom: 8px; }
        h1 { 
          font-size: 28px; 
          color: #4C6FFF; 
          margin-bottom: 8px;
        }
        .subtitle { 
          color: #666; 
          font-size: 14px; 
        }
        .section { margin-bottom: 30px; }
        .section-heading { 
          font-size: 18px; 
          color: #A855F7; 
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e5e5;
        }
        .stat-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 16px; 
        }
        .stat-item { 
          background: linear-gradient(135deg, #f8f9ff 0%, #fff5f5 100%);
          padding: 16px; 
          border-radius: 12px;
          border: 1px solid #e5e5e5;
        }
        .stat-label { 
          font-size: 12px; 
          color: #666; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-value { 
          font-size: 24px; 
          font-weight: bold; 
          color: #4C6FFF;
          margin-top: 4px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 16px;
        }
        th { 
          background: linear-gradient(135deg, #4C6FFF, #A855F7);
          color: white; 
          padding: 12px; 
          text-align: left;
          font-size: 13px;
        }
        td { 
          padding: 12px; 
          border-bottom: 1px solid #e5e5e5;
          font-size: 13px;
        }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          color: #999;
          font-size: 12px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
        }
        .emoji { font-size: 20px; margin-right: 8px; }
        @media print {
          body { padding: 20px; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🚀✨</div>
        <h1>${data.title}</h1>
        ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}
        <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })}</p>
      </div>

      ${data.sections.map(section => `
        <div class="section">
          <h2 class="section-heading"><span class="emoji">📊</span>${section.heading}</h2>
          <div class="stat-grid">
            ${section.items.map(item => `
              <div class="stat-item">
                <div class="stat-label">${item.label}</div>
                <div class="stat-value">${item.value}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      ${data.tableData ? `
        <div class="section">
          <h2 class="section-heading"><span class="emoji">📋</span>Detailed Data</h2>
          <table>
            <thead>
              <tr>${data.tableData.headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.tableData.rows.map(row => `
                <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>🎓 TechnoVista - ICSK Khaitan Techno Club 2025</p>
        <p>Dream | Build | Innovate</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
}

export function exportMembersReport(members: any[]) {
  const totalXP = members.reduce((sum, m) => sum + (m.xp_points || 0), 0);
  const avgLevel = members.length > 0 ? (members.reduce((sum, m) => sum + (m.level || 1), 0) / members.length).toFixed(1) : 0;

  generatePDFReport({
    title: "TechnoVista Members Report",
    subtitle: "Comprehensive member analytics and statistics",
    sections: [
      {
        heading: "Overview Statistics",
        items: [
          { label: "Total Members", value: members.length },
          { label: "Total XP Earned", value: totalXP.toLocaleString() },
          { label: "Average Level", value: avgLevel },
        ]
      }
    ],
    tableData: {
      headers: ["Name", "TechnoVista ID", "Grade", "XP Points", "Level"],
      rows: members.map(m => [
        m.full_name || "N/A",
        m.technovista_id || "N/A",
        m.grade || "N/A",
        m.xp_points || 0,
        m.level || 1
      ])
    }
  }, "technovista-members-report");
}

export function exportProjectsReport(projects: any[]) {
  const approved = projects.filter(p => p.status === "approved").length;
  const featured = projects.filter(p => p.is_featured).length;
  const categories = [...new Set(projects.map(p => p.category))].length;

  generatePDFReport({
    title: "TechnoVista Projects Report",
    subtitle: "Complete project showcase and analytics",
    sections: [
      {
        heading: "Project Statistics",
        items: [
          { label: "Total Projects", value: projects.length },
          { label: "Approved", value: approved },
          { label: "Featured", value: featured },
          { label: "Categories", value: categories },
        ]
      }
    ],
    tableData: {
      headers: ["Title", "Category", "Status", "Featured", "Created"],
      rows: projects.map(p => [
        p.title || "N/A",
        p.category || "N/A",
        p.status || "pending",
        p.is_featured ? "⭐ Yes" : "No",
        new Date(p.created_at).toLocaleDateString()
      ])
    }
  }, "technovista-projects-report");
}

export function exportUserProgressReport(profile: any, projects: any[], badges: any[]) {
  generatePDFReport({
    title: "My TechnoVista Progress",
    subtitle: `Personal progress report for ${profile?.full_name || "Member"}`,
    sections: [
      {
        heading: "Profile Overview",
        items: [
          { label: "TechnoVista ID", value: profile?.technovista_id || "N/A" },
          { label: "XP Points", value: profile?.xp_points || 0 },
          { label: "Current Level", value: profile?.level || 1 },
        ]
      },
      {
        heading: "Achievements",
        items: [
          { label: "Projects Submitted", value: projects.length },
          { label: "Badges Earned", value: badges.length },
          { label: "Member Since", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A" },
        ]
      }
    ],
    tableData: projects.length > 0 ? {
      headers: ["Project Title", "Category", "Status", "Date"],
      rows: projects.map(p => [
        p.title,
        p.category || "N/A",
        p.status || "pending",
        new Date(p.created_at).toLocaleDateString()
      ])
    } : undefined
  }, "my-technovista-progress");
}
