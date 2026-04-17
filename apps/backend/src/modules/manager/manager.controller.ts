import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateTariffDto,
  CreateVehicleDto,
  CreateZoneDto,
  UpdateTariffDto,
  UpdateVehicleDto,
  UpdateZoneDto,
} from './manager.dto';

@ApiTags('Manager Vehicles')
@Controller('manager/vehicles')
export class ManagerVehicleController {
  @Post()
  @ApiOperation({ summary: 'Create vehicle' })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({ status: 201, description: 'Vehicle created (stub)' })
  create(@Body() dto: CreateVehicleDto) {
    return { endpoint: 'manager/vehicles', dto };
  }

  @Get()
  @ApiOperation({ summary: 'Get vehicles list (includes non-deleted only)' })
  @ApiResponse({ status: 200, description: 'Vehicle list (stub)' })
  list() {
    return { endpoint: 'manager/vehicles' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by id' })
  @ApiResponse({ status: 200, description: 'Vehicle details (stub)' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/vehicles/${id}` };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle fields' })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({ status: 200, description: 'Vehicle updated (stub)' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return { endpoint: `manager/vehicles/${id}`, dto };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete vehicle (sets deletedAt)' })
  @ApiResponse({ status: 200, description: 'Vehicle soft-deleted (stub)' })
  remove(@Param('id') id: string) {
    return { endpoint: `manager/vehicles/${id}` };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted vehicle (clears deletedAt)' })
  @ApiResponse({ status: 200, description: 'Vehicle restored (stub)' })
  restore(@Param('id') id: string) {
    return { endpoint: `manager/vehicles/${id}/restore` };
  }
}

@ApiTags('Manager Tariffs')
@Controller('manager/tariffs')
export class TariffController {
  @Post()
  @ApiOperation({ summary: 'Create tariff' })
  @ApiBody({ type: CreateTariffDto })
  @ApiResponse({ status: 201, description: 'Tariff created (stub)' })
  create(@Body() dto: CreateTariffDto) {
    return { endpoint: 'manager/tariffs', dto };
  }

  @Get()
  @ApiOperation({
    summary: 'Get tariffs list (excludes soft deleted by default)',
  })
  @ApiResponse({ status: 200, description: 'Tariff list (stub)' })
  list() {
    return { endpoint: 'manager/tariffs' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tariff by id' })
  @ApiResponse({ status: 200, description: 'Tariff details (stub)' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/tariffs/${id}` };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tariff fields' })
  @ApiBody({ type: UpdateTariffDto })
  @ApiResponse({ status: 200, description: 'Tariff updated (stub)' })
  update(@Param('id') id: string, @Body() dto: UpdateTariffDto) {
    return { endpoint: `manager/tariffs/${id}`, dto };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete tariff (sets deletedAt)' })
  @ApiResponse({ status: 200, description: 'Tariff soft-deleted (stub)' })
  remove(@Param('id') id: string) {
    return { endpoint: `manager/tariffs/${id}` };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted tariff (clears deletedAt)' })
  @ApiResponse({ status: 200, description: 'Tariff restored (stub)' })
  restore(@Param('id') id: string) {
    return { endpoint: `manager/tariffs/${id}/restore` };
  }
}

@ApiTags('Manager Zones')
@Controller('manager/zones')
export class ZoneController {
  @Post()
  @ApiOperation({ summary: 'Create zone with GeoJSON Polygon geometry' })
  @ApiBody({ type: CreateZoneDto })
  @ApiResponse({ status: 201, description: 'Zone created (stub)' })
  create(@Body() dto: CreateZoneDto) {
    return { endpoint: 'manager/zones', dto };
  }

  @Get()
  @ApiOperation({
    summary: 'Get zone list (supports active + soft delete behavior)',
  })
  @ApiResponse({ status: 200, description: 'Zone list (stub)' })
  list() {
    return { endpoint: 'manager/zones' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get zone by id with GeoJSON Polygon geometry' })
  @ApiResponse({ status: 200, description: 'Zone details (stub)' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/zones/${id}` };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update zone fields and/or GeoJSON Polygon geometry',
  })
  @ApiBody({ type: UpdateZoneDto })
  @ApiResponse({ status: 200, description: 'Zone updated (stub)' })
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return { endpoint: `manager/zones/${id}`, dto };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete zone (sets deletedAt or disables availability)',
  })
  @ApiResponse({ status: 200, description: 'Zone soft-deleted (stub)' })
  remove(@Param('id') id: string) {
    return { endpoint: `manager/zones/${id}` };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted zone' })
  @ApiResponse({ status: 200, description: 'Zone restored (stub)' })
  restore(@Param('id') id: string) {
    return { endpoint: `manager/zones/${id}/restore` };
  }
}

@ApiTags('Manager Trips')
@Controller('manager/trips')
export class ManagerTripController {
  @Get('active')
  @ApiOperation({ summary: 'Get all active trips' })
  @ApiResponse({ status: 200, description: 'Active trips list (stub)' })
  active() {
    return { endpoint: 'manager/trips/active' };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get finished and cancelled trip history' })
  @ApiResponse({ status: 200, description: 'Trip history list (stub)' })
  history() {
    return { endpoint: 'manager/trips/history' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get manager trip details by id' })
  @ApiResponse({ status: 200, description: 'Trip details (stub)' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/trips/${id}` };
  }
}

@ApiTags('Manager Violations')
@Controller('manager/violations')
export class ViolationController {
  @Get()
  @ApiOperation({ summary: 'Get violations list' })
  @ApiResponse({ status: 200, description: 'Violations list (stub)' })
  list() {
    return { endpoint: 'manager/violations' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get violation statistics' })
  @ApiResponse({ status: 200, description: 'Violation stats (stub)' })
  stats() {
    return { endpoint: 'manager/violations/stats' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get violation by id' })
  @ApiResponse({ status: 200, description: 'Violation details (stub)' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/violations/${id}` };
  }

  @Post(':id/warn')
  @ApiOperation({ summary: 'Send warning for a violation' })
  @ApiResponse({ status: 200, description: 'Violation warning sent (stub)' })
  warn(@Param('id') id: string) {
    return { endpoint: `manager/violations/${id}/warn` };
  }
}
