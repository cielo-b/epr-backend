import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';
import { Clergy } from '../entities/clergy.entity';
import { Expense } from '../entities/expense.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ImportExportService {
    constructor(
        @InjectRepository(Member) private memberRepo: Repository<Member>,
        @InjectRepository(Clergy) private clergyRepo: Repository<Clergy>,
        @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
        private auditService: AuditService,
    ) { }

    async exportToExcel(data: any[], fileName: string): Promise<Buffer> {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    async generatePDF(data: any[], title: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // Header - Church Branding
            doc.fillColor('#008751').fontSize(20).text('Eglise Presbyterienne au Rwanda', { align: 'center' });
            doc.fillColor('#444444').fontSize(10).text('Official Ecclesiastical Record', { align: 'center' });
            doc.moveDown(1);
            doc.lineWidth(1).strokeColor('#eeeeee').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(2);

            // Report Title
            doc.fillColor('#333333').fontSize(16).text(title, { underline: true });
            doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`);
            doc.moveDown(2);

            // Simple Table Logic
            if (data.length > 0) {
                const keys = Object.keys(data[0]).slice(0, 6); // Limit to 6 columns for A4

                // Table Header
                doc.fillColor('#f8f9fa').rect(50, doc.y, 495, 25).fill();
                doc.fillColor('#111111').fontSize(9).font('Helvetica-Bold');

                let startX = 60;
                keys.forEach(key => {
                    doc.text(key.toUpperCase(), startX, doc.y - 18, { width: 80 });
                    startX += 80;
                });

                doc.moveDown(1);
                doc.font('Helvetica').fillColor('#444444');

                // Rows
                data.forEach((row, i) => {
                    if (doc.y > 700) doc.addPage().moveDown(2);

                    startX = 60;
                    const y = doc.y;

                    keys.forEach(key => {
                        const val = row[key]?.toString() || 'N/A';
                        doc.text(val, startX, y, { width: 75, height: 20 });
                        startX += 80;
                    });

                    doc.moveDown(1.5);
                    doc.lineWidth(0.5).strokeColor('#f1f1f1').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
                });
            } else {
                doc.text('No records found for this report.');
            }

            // Footer
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('#999999').text(
                    `Page ${i + 1} of ${range.count} - EPR MIS Central Server Reporting System`,
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );
            }

            doc.end();
        });
    }

    async importFromExcel(fileBuffer: Buffer, module: 'members' | 'clergy' | 'expenses', actorId: string): Promise<any> {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        if (rawData.length === 0) {
            throw new BadRequestException('The Excel file is empty');
        }

        let results = { success: 0, failed: 0, errors: [] };

        for (const row of rawData as any[]) {
            try {
                if (module === 'members') {
                    await this.memberRepo.save(this.memberRepo.create(row));
                } else if (module === 'clergy') {
                    await this.clergyRepo.save(this.clergyRepo.create(row));
                } else if (module === 'expenses') {
                    await this.expenseRepo.save(this.expenseRepo.create(row));
                }
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push({ row, error: err.message });
            }
        }

        await this.auditService.log({
            action: 'IMPORT',
            module: module.toUpperCase(),
            description: `Imported ${results.success} records from Excel. ${results.failed} failed.`,
            actorId,
            payload: { results }
        });

        return results;
    }
}
