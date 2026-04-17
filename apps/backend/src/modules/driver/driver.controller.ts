import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CancelTripDto,
  DriverTripsQueryDto,
  FinishTripDto,
  NearbyVehiclesQueryDto,
  StartTripDto,
} from './driver.dto';

@ApiTags('Driver Vehicles')
@Controller('driver/vehicles')
export class DriverVehicleController {
  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby available vehicles' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lon', type: Number })
  @ApiQuery({ name: 'radiusMeters', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Nearby vehicle list (stub)' })
  getNearby(@Query() query: NearbyVehiclesQueryDto) {
    return { endpoint: 'driver/vehicles/nearby', query };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed vehicle info for driver view' })
  @ApiResponse({ status: 200, description: 'Vehicle details (stub)' })
  getById(@Param('id') id: string) {
    return { endpoint: `driver/vehicles/${id}` };
  }
}

@ApiTags('Driver Trips')
@Controller('driver/trips')
export class DriverTripController {
  @Post('start')
  @ApiOperation({ summary: 'Start a trip' })
  @ApiBody({ type: StartTripDto })
  @ApiResponse({ status: 201, description: 'Trip start accepted (stub)' })
  start(@Body() dto: StartTripDto) {
    return { endpoint: 'driver/trips/start', dto };
  }

  @Post(':id/finish')
  @ApiOperation({ summary: 'Finish an active trip' })
  @ApiBody({ type: FinishTripDto })
  @ApiResponse({ status: 200, description: 'Trip finish accepted (stub)' })
  finish(@Param('id') id: string, @Body() dto: FinishTripDto) {
    return { endpoint: `driver/trips/${id}/finish`, dto };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active trip' })
  @ApiBody({ type: CancelTripDto })
  @ApiResponse({ status: 200, description: 'Trip cancellation accepted (stub)' })
  cancel(@Param('id') id: string, @Body() dto: CancelTripDto) {
    return { endpoint: `driver/trips/${id}/cancel`, dto };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip details by id' })
  @ApiResponse({ status: 200, description: 'Trip details (stub)' })
  getById(@Param('id') id: string) {
    return { endpoint: `driver/trips/${id}` };
  }

  @Get(':id/route')
  @ApiOperation({ summary: 'Get trip route telemetry path' })
  @ApiResponse({ status: 200, description: 'Trip route (stub)' })
  getRoute(@Param('id') id: string) {
    return { endpoint: `driver/trips/${id}/route` };
  }
}

@ApiTags('Driver')
@Controller('driver')
export class DriverController {
  @Get('me')
  @ApiOperation({ summary: 'Get current driver profile' })
  @ApiResponse({ status: 200, description: 'Driver profile (stub)' })
  me() {
    return { endpoint: 'driver/me' };
  }

  @Get('trips')
  @ApiOperation({ summary: 'Get driver trips list' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'FINISHED', 'CANCELLED'] })
  @ApiResponse({ status: 200, description: 'Driver trip list (stub)' })
  trips(@Query() query: DriverTripsQueryDto) {
    return { endpoint: 'driver/trips', query };
  }
}
