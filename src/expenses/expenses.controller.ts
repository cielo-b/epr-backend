import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpenseCategory, ExpenseStatus } from '../entities/expense.entity';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) { }

    @Post()
    @ApiOperation({ summary: 'Record a new expense' })
    @ApiResponse({ status: 201, description: 'Expense recorded successfully' })
    create(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser() user: any) {
        return this.expensesService.create(createExpenseDto, user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all expenses' })
    @ApiQuery({ name: 'parishId', required: false })
    @ApiQuery({ name: 'presbyteryId', required: false })
    @ApiQuery({ name: 'category', required: false, enum: ExpenseCategory })
    @ApiQuery({ name: 'status', required: false, enum: ExpenseStatus })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiResponse({ status: 200, description: 'List of expenses' })
    findAll(
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
        @Query('category') category?: ExpenseCategory,
        @Query('status') status?: ExpenseStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @CurrentUser() user?: any,
    ) {
        return this.expensesService.findAll({
            parishId,
            presbyteryId,
            category,
            status,
            startDate,
            endDate,
        }, user);
    }

    @Get('generate-voucher')
    @ApiOperation({ summary: 'Generate a new unique voucher number' })
    @ApiResponse({ status: 200, description: 'New voucher number' })
    async generateVoucher() {
        const number = await this.expensesService.generateVoucherNumber();
        return { voucherNumber: number };
    }

    @Get('statistics')
    @ApiOperation({ summary: 'Get expense statistics' })
    @ApiQuery({ name: 'parishId', required: false })
    @ApiQuery({ name: 'presbyteryId', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiResponse({ status: 200, description: 'Expense statistics' })
    getStatistics(
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @CurrentUser() user?: any,
    ) {
        return this.expensesService.getStatistics({
            parishId,
            presbyteryId,
            startDate,
            endDate,
        }, user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an expense by ID' })
    @ApiResponse({ status: 200, description: 'Expense details' })
    @ApiResponse({ status: 404, description: 'Not found' })
    findOne(@Param('id') id: string, @CurrentUser() user?: any) {
        return this.expensesService.findOne(id, user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an expense record' })
    @ApiResponse({ status: 200, description: 'Updated successfully' })
    update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto, @CurrentUser() user?: any) {
        return this.expensesService.update(id, updateExpenseDto, user);
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve a pending expense' })
    @ApiResponse({ status: 200, description: 'Approved successfully' })
    approve(
        @Param('id') id: string,
        @Body() approvalData: { userId: string; userName: string },
        @CurrentUser() user?: any,
    ) {
        return this.expensesService.approveExpense(id, approvalData, user);
    }

    @Patch(':id/pay')
    @ApiOperation({ summary: 'Mark an approved expense as paid' })
    @ApiResponse({ status: 200, description: 'Marked as paid' })
    pay(
        @Param('id') id: string,
        @Body() paymentData: { userId: string; userName: string; method: string; reference?: string },
        @CurrentUser() user?: any,
    ) {
        return this.expensesService.markAsPaid(id, paymentData, user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an expense record' })
    @ApiResponse({ status: 200, description: 'Deleted successfully' })
    remove(@Param('id') id: string, @CurrentUser() user?: any) {
        return this.expensesService.remove(id, user);
    }
}
