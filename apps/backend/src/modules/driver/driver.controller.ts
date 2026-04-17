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

@ApiTags('Автомобили водителя')
@Controller('driver/vehicles')
export class DriverVehicleController {
  @Get('nearby')
  @ApiOperation({ summary: 'Получить ближайшие доступные автомобили' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lon', type: Number })
  @ApiQuery({ name: 'radiusMeters', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Список ближайших автомобилей' })
  getNearby(@Query() query: NearbyVehiclesQueryDto) {
    return { endpoint: 'driver/vehicles/nearby', query };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить подробную информацию об автомобиле' })
  @ApiResponse({ status: 200, description: 'Детали автомобиля' })
  getById(@Param('id') id: string) {
    return { endpoint: `driver/vehicles/${id}` };
  }
}

@ApiTags('Поездки водителя')
@Controller('driver/trips')
export class DriverTripController {
  @Post('start')
  @ApiOperation({ summary: 'Начать поездку' })
  @ApiBody({ type: StartTripDto })
  @ApiResponse({ status: 201, description: 'Поездка успешно начата' })
  start(@Body() dto: StartTripDto) {
    return { endpoint: 'driver/trips/start', dto };
  }

  @Post(':id/finish')
  @ApiOperation({ summary: 'Завершить активную поездку' })
  @ApiBody({ type: FinishTripDto })
  @ApiResponse({ status: 200, description: 'Поездка успешно завершена' })
  finish(@Param('id') id: string, @Body() dto: FinishTripDto) {
    return { endpoint: `driver/trips/${id}/finish`, dto };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Отменить активную поездку' })
  @ApiBody({ type: CancelTripDto })
  @ApiResponse({
    status: 200,
    description: 'Поездка успешно отменена',
  })
  cancel(@Param('id') id: string, @Body() dto: CancelTripDto) {
    return { endpoint: `driver/trips/${id}/cancel`, dto };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детали поездки по идентификатору' })
  @ApiResponse({ status: 200, description: 'Детали поездки' })
  getById(@Param('id') id: string) {
    return { endpoint: `driver/trips/${id}` };
  }

  @Get(':id/route')
  @ApiOperation({ summary: 'Получить маршрут поездки по данным телеметрии' })
  @ApiResponse({ status: 200, description: 'Маршрут поездки' })
  getRoute(@Param('id') id: string) {
    return { endpoint: `driver/trips/${id}/route` };
  }
}

@ApiTags('Водитель')
@Controller('driver')
export class DriverController {
  @Get('me')
  @ApiOperation({ summary: 'Получить профиль текущего водителя' })
  @ApiResponse({ status: 200, description: 'Профиль водителя' })
  me() {
    return { endpoint: 'driver/me' };
  }

  @Get('trips')
  @ApiOperation({ summary: 'Получить список поездок водителя' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'FINISHED', 'CANCELLED'],
  })
  @ApiResponse({ status: 200, description: 'Список поездок водителя' })
  trips(@Query() query: DriverTripsQueryDto) {
    return { endpoint: 'driver/trips', query };
  }
}
