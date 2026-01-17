import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory, ExpenseStatus } from '../../entities/expense.entity';

export class CreateExpenseDto {
    @ApiProperty()
    @IsString()
    voucherNumber: string;

    @ApiProperty({ enum: ExpenseCategory })
    @IsEnum(ExpenseCategory)
    category: ExpenseCategory;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsDateString()
    date: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    parishId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    presbyteryId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    payeeName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    payeePhone?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    payeeAccount?: string;

    @ApiPropertyOptional({ enum: ExpenseStatus })
    @IsEnum(ExpenseStatus)
    @IsOptional()
    status?: ExpenseStatus;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    requestedBy?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    requestedByName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    transactionReference?: string;

    @ApiPropertyOptional()
    @IsUrl()
    @IsOptional()
    receiptUrl?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}
