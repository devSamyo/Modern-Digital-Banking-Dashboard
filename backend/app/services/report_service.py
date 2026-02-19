from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from decimal import Decimal
import io

from app.models.account import Account
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.bill import Bill
from app.services.budget_service import BudgetService


class ReportService:
    """Service for generating PDF reports"""
    
    @staticmethod
    def generate_monthly_summary_pdf(db: Session, user_id: int, month: int, year: int) -> io.BytesIO:
        """Generate a comprehensive monthly summary PDF report"""
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        
        # Title
        title = Paragraph(f"<b>Monthly Financial Summary</b><br/>{months[month - 1]} {year}", title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.2 * inch))
        
        # Get user's accounts
        account_ids = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc[0] for acc in account_ids]
        
        # Calculate income and expenses
        total_income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == 'credit',
            extract('year', Transaction.txn_date) == year,
            extract('month', Transaction.txn_date) == month
        ).scalar() or Decimal('0.00')
        
        total_expenses = db.query(func.sum(Transaction.amount)).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == 'debit',
            extract('year', Transaction.txn_date) == year,
            extract('month', Transaction.txn_date) == month
        ).scalar() or Decimal('0.00')
        
        net_savings = total_income - total_expenses
        
        # Summary section
        elements.append(Paragraph("<b>Financial Overview</b>", heading_style))
        summary_data = [
            ['Metric', 'Amount'],
            ['Total Income', f'Rs. {total_income:,.2f}'],
            ['Total Expenses', f'Rs. {total_expenses:,.2f}'],
            ['Net Savings', f'Rs. {net_savings:,.2f}'],
        ]
        
        summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Budget Status
        elements.append(Paragraph("<b>Budget Status</b>", heading_style))
        budgets = BudgetService.get_all_budgets_with_spending(db, user_id, month, year)
        
        if budgets:
            budget_data = [['Category', 'Budget', 'Spent', 'Remaining', 'Status']]
            for budget in budgets:
                status = 'Over' if budget['is_over_budget'] else 'Good'
                budget_data.append([
                    budget['category'],
                    f"Rs. {budget['limit_amount']:,.2f}",
                    f"Rs. {budget['spent_amount']:,.2f}",
                    f"Rs. {budget['remaining_amount']:,.2f}",
                    status
                ])
            
            budget_table = Table(budget_data, colWidths=[1.5 * inch, 1.2 * inch, 1.2 * inch, 1.2 * inch, 1 * inch])
            budget_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            
            elements.append(budget_table)
        else:
            elements.append(Paragraph("No budgets set for this month.", styles['Normal']))
        
        elements.append(Spacer(1, 0.3 * inch))
        
        # Bills Status
        elements.append(Paragraph("<b>Bills Summary</b>", heading_style))
        bills = db.query(Bill).filter(
            Bill.user_id == user_id,
            extract('year', Bill.due_date) == year,
            extract('month', Bill.due_date) == month
        ).all()
        
        if bills:
            bill_data = [['Biller', 'Amount', 'Due Date', 'Status']]
            for bill in bills:
                bill_data.append([
                    bill.biller_name,
                    f"Rs. {bill.amount_due:,.2f}",
                    bill.due_date.strftime('%Y-%m-%d'),
                    bill.status.upper()
                ])
            
            bill_table = Table(bill_data, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch])
            bill_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            
            elements.append(bill_table)
        else:
            elements.append(Paragraph("No bills for this month.", styles['Normal']))
        
        # Footer
        elements.append(Spacer(1, 0.5 * inch))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        footer = Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style)
        elements.append(footer)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def generate_category_breakdown_pdf(db: Session, user_id: int, month: int, year: int) -> io.BytesIO:
        """Generate a detailed category breakdown PDF report"""
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#8b5cf6'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#8b5cf6'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        
        # Title
        title = Paragraph(f"<b>Category Spending Breakdown</b><br/>{months[month - 1]} {year}", title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.2 * inch))
        
        # Get user's accounts
        account_ids = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc[0] for acc in account_ids]
        
        # Get category spending
        category_spending = db.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total_spent'),
            func.count(Transaction.id).label('transaction_count')
        ).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == 'debit',
            extract('year', Transaction.txn_date) == year,
            extract('month', Transaction.txn_date) == month
        ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).all()
        
        if category_spending:
            # Calculate total and percentages
            total_spending = sum(cat.total_spent for cat in category_spending)
            
            elements.append(Paragraph(f"<b>Total Spending: Rs. {total_spending:,.2f}</b>", heading_style))
            elements.append(Spacer(1, 0.2 * inch))
            
            # Category breakdown table
            elements.append(Paragraph("<b>Category Details</b>", heading_style))
            
            cat_data = [['Category', 'Amount', 'Transactions', 'Percentage']]
            for cat in category_spending:
                percentage = (cat.total_spent / total_spending * 100) if total_spending > 0 else 0
                cat_data.append([
                    cat.category,
                    f"Rs. {cat.total_spent:,.2f}",
                    str(cat.transaction_count),
                    f"{percentage:.1f}%"
                ])
            
            cat_table = Table(cat_data, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch])
            cat_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lavender),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
            ]))
            
            elements.append(cat_table)
            elements.append(Spacer(1, 0.3 * inch))
            
            # Top 3 categories highlight
            elements.append(Paragraph("<b>Top 3 Spending Categories</b>", heading_style))
            top_3_data = [['Rank', 'Category', 'Amount', 'Share']]
            for idx, cat in enumerate(category_spending[:3], 1):
                percentage = (cat.total_spent / total_spending * 100) if total_spending > 0 else 0
                medal = '#1' if idx == 1 else '#2' if idx == 2 else '#3'
                top_3_data.append([
                    medal,
                    cat.category,
                    f"Rs. {cat.total_spent:,.2f}",
                    f"{percentage:.1f}%"
                ])
            
            top_3_table = Table(top_3_data, colWidths=[1 * inch, 2 * inch, 1.5 * inch, 1.5 * inch])
            top_3_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
            ]))
            
            elements.append(top_3_table)
            
        else:
            elements.append(Paragraph("No spending data available for this month.", styles['Normal']))
        
        # Footer
        elements.append(Spacer(1, 0.5 * inch))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        footer = Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style)
        elements.append(footer)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer