
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Client } from '../types';
import { formatCurrency } from '../utils';

export const generateProjectInvoice = (project: Project, client: Client | undefined, metadata: any) => {
    const doc = new jsPDF();
    const currency = project.currency || 'AUD';
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // --- Data Extraction ---
    const billedBy = metadata.billedBy;
    const billedTo = metadata.billedTo;
    const invoiceNumber = metadata.invoiceNumber;
    const dueDate = metadata.dueDate ? new Date(metadata.dueDate).toLocaleDateString('en-GB') : 'Upon Completion';
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const footerText = "Novalink Innovations (Pvt) Ltd | PV 00337332 | info@novalinkinnovations.com | www.novalinkinnovations.com";

    // --- Calculations ---
    const activeItems = (metadata.items || []).filter((i: any) => i.included);
    const totalAmount = activeItems.reduce((sum: number, i: any) => sum + i.amount, 0);

    // --- Header Section ---
    // Logo
    try {
        doc.addImage('/logo.png', 'PNG', margin, 15, 50, 12);
    } catch (e) {
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(margin, 15, 10, 10, 2, 2, 'F');
        doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(15, 23, 42);
        doc.text("Novalink", margin + 14, 23);
    }

    // Centered Title
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(15, 23, 42);
    doc.text("INVOICE", pageWidth / 2, 38, { align: 'center' });

    // Company Info (Top Right)
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
    const rightAlignX = pageWidth - margin;
    doc.text(billedBy.name, rightAlignX, 18, { align: 'right' });
    doc.text(billedBy.address, rightAlignX, 23, { align: 'right' });
    doc.text(`Email: ${billedBy.email}`, rightAlignX, 28, { align: 'right' });
    doc.text(`Phone: ${billedBy.phone}`, rightAlignX, 33, { align: 'right' });

    // --- Billed To Section ---
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
    doc.text("BILLED BY", margin, 55);
    doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
    doc.text(billedBy.name, margin, 60);
    doc.text(billedBy.email, margin, 65);
    doc.text(billedBy.phone, margin, 70);

    const midColumnX = 110;
    doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
    doc.text("BILLED TO", midColumnX, 55);
    doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
    doc.text(billedTo.company, midColumnX, 60);
    doc.text(billedTo.name, midColumnX, 65);
    doc.text(billedTo.email, midColumnX, 70);
    doc.text(billedTo.phone, midColumnX, 75);

    // --- Invoice Details Box ---
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, 85, pageWidth - (margin * 2), 25, 4, 4, 'F');

    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text("INVOICE NUMBER", margin + 6, 93);
    doc.text("DATE OF ISSUE", margin + 50, 93);
    doc.text("DUE DATE", margin + 95, 93);
    doc.text("STATUS", pageWidth - margin - 6, 93, { align: 'right' });

    doc.setTextColor(15, 23, 42); doc.setFontSize(11);
    doc.text(invoiceNumber, margin + 6, 101);
    doc.text(invoiceDate, margin + 50, 101);
    doc.text(dueDate, margin + 95, 101);
    doc.text("UNPAID", pageWidth - margin - 6, 101, { align: 'right' });

    // --- Items Table ---
    const tableData = activeItems.map((item: any) => [
        item.description,
        item.type,
        formatCurrency(item.amount, currency)
    ]);

    autoTable(doc, {
        startY: 120,
        head: [['DESCRIPTION', 'TYPE', 'AMOUNT']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            cellPadding: 5
        },
        bodyStyles: {
            fontSize: 10,
            textColor: [71, 85, 105],
            cellPadding: 5
        },
        columnStyles: {
            2: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
        },
        margin: { left: margin, right: margin }
    });

    // --- Summary ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(15, 23, 42);
    doc.text("NET SETTLEMENT AMOUNT:", 110, finalY);
    doc.setFontSize(14); doc.setTextColor(37, 99, 235);
    doc.text(formatCurrency(totalAmount, currency), pageWidth - margin, finalY, { align: 'right' });

    // Footer Info Box
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, finalY + 10, pageWidth - (margin * 2), 12, 2, 2, 'F');
    doc.setFontSize(9); doc.setTextColor(37, 99, 235);
    doc.text(`Invoice generated for project: ${project.name}`, pageWidth / 2, finalY + 18, { align: 'center' });

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
    doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text("Generated by NovaLink Intelligence Platform | Protocol v2.1", pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`${invoiceNumber}_${project.name.replace(/\s+/g, '_')}.pdf`);
};
