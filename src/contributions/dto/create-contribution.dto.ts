import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContributionType, PaymentMethod } from '../../entities/contribution.entity';

export class CreateContributionDto {
    @ApiProperty({ description: 'Receipt number (unique)' })
    @IsString()
    receiptNumber: string;

    @ApiProperty({ description: 'Contribution type', enum: ContributionType })
    @IsEnum(ContributionType)
    type: ContributionType;

    @ApiProperty({ description: 'Amount' })
    @IsNumber()
    amount: number;

    @ApiProperty({ description: 'Date of contribution' })
    @IsDateString()
    date: string;

    @ApiPropertyOptional({ description: 'Parish ID' })
    @IsOptional()
    @IsString()
    parishId?: string;

    @ApiPropertyOptional({ description: 'Presbytery ID' })
    @IsOptional()
    @IsString()
    presbyteryId?: string;

    @ApiPropertyOptional({ description: 'Member ID' })
    @IsOptional()
    @IsString()
    memberId?: string;

    @ApiPropertyOptional({ description: 'Contributor name' })
    @IsOptional()
    @IsString()
    contributorName?: string;

    @ApiPropertyOptional({ description: 'Contributor phone' })
    @IsOptional()
    @IsString()
    contributorPhone?: string;

    @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional({ description: 'Transaction reference' })
    @IsOptional()
    @IsString()
    transactionReference?: string;

    @ApiPropertyOptional({ description: 'Purpose or project' })
    @IsOptional()
    @IsString()
    purpose?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Is anonymous', default: false })
    @IsOptional()
    @IsBoolean()
    isAnonymous?: boolean;

    @ApiPropertyOptional({ description: 'Collected by (User ID)' })
    @IsOptional()
    @IsString()
    collectedBy?: string;

    @ApiPropertyOptional({ description: 'Collector name' })
    @IsOptional()
    @IsString()
    collectorName?: string;

    @ApiPropertyOptional({ description: 'Receipt issued', default: true })
    @IsOptional()
    @IsBoolean()
    receiptIssued?: boolean;
}
