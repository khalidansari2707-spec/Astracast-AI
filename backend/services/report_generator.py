from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io
import pandas as pd
import datetime

class ReportGenerator:
    @staticmethod
    def generate_pdf_report(predictions: list, stats: dict) -> io.BytesIO:
        """
        Creates a beautiful PDF report of space weather predictions.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles for AstraCast theme (sleek, enterprise)
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#0F172A'), # dark slate
            spaceAfter=6
        )
        
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=20
        )
        
        section_style = ParagraphStyle(
            'SectionStyle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=15,
            spaceAfter=10
        )
        
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#334155'),
            leading=14
        )

        # Title Block
        story.append(Paragraph("AstraCast AI — Space Weather Forecast Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Classification: Operations", subtitle_style))
        
        # Executive Summary Section
        story.append(Paragraph("Executive Summary", section_style))
        summary_text = (
            f"This analytical space weather report presents short and medium-term forecasting projections. "
            f"The maximum storm probability over the next 7 days is projected to reach {stats.get('risk_score', 0.0):.1f}%. "
            f"The current average forecasting confidence index stands at {stats.get('avg_confidence', 0.0):.1f}%. "
            f"Operations teams should review the horizon-specific advisory cards below."
        )
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 15))
        
        # Predictions Table
        story.append(Paragraph("Horizon-Specific AI Forecasts", section_style))
        
        table_data = [[
            Paragraph("<b>Horizon</b>", body_style),
            Paragraph("<b>Storm Prob %</b>", body_style),
            Paragraph("<b>Electron PFU</b>", body_style),
            Paragraph("<b>Solar Wind Speed</b>", body_style),
            Paragraph("<b>IMF Bz</b>", body_style),
            Paragraph("<b>Rad Category</b>", body_style)
        ]]
        
        for p in predictions:
            # Format row
            table_data.append([
                Paragraph(p["horizon"], body_style),
                Paragraph(f"{p['storm_probability']*100:.1f}%", body_style),
                Paragraph(f"{p['expected_electron_flux']:.1f}", body_style),
                Paragraph(f"{p['expected_solar_wind_speed']:.1f} km/s", body_style),
                Paragraph(f"{p['expected_imf_bz']:.2f} nT", body_style),
                Paragraph(p["expected_radiation_category"], body_style)
            ])
            
        t = Table(table_data, colWidths=[60, 90, 90, 110, 80, 90])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('TOPPADDING', (0,0), (-1,0), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0,1), (-1,-1), 6),
            ('BOTTOMPADDING', (0,1), (-1,-1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))
        
        # Recommended Operations Section
        story.append(Paragraph("Operational Action Items & Recommendations", section_style))
        for p in predictions:
            if p["storm_probability"] > 0.3 or p["expected_radiation_category"] != "S0":
                advisory_msg = f"<b>{p['horizon']} Horizon Advisory:</b> {p['recommended_action']}"
                story.append(Paragraph(advisory_msg, body_style))
                story.append(Spacer(1, 4))
                
        if len(story) <= 7: # If no major alerts, display standard operation status
            story.append(Paragraph("All systems nominal. No immediate protective mitigations required.", body_style))
            
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_excel_report(predictions: list) -> io.BytesIO:
        """
        Creates a spreadsheet report of predictions.
        """
        df = pd.DataFrame(predictions)
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="AstraCast Predictions")
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_csv_report(predictions: list) -> str:
        """
        Creates a CSV string of predictions.
        """
        df = pd.DataFrame(predictions)
        return df.to_csv(index=False)
