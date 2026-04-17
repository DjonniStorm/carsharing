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

@ApiTags('Автомобили менеджера')
@Controller('manager/vehicles')
export class ManagerVehicleController {
  @Post()
  @ApiOperation({ summary: 'Создать автомобиль' })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({ status: 201, description: 'Автомобиль создан' })
  create(@Body() dto: CreateVehicleDto) {
    return { endpoint: 'manager/vehicles', dto };
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список автомобилей без удаленных записей',
  })
  @ApiResponse({ status: 200, description: 'Список автомобилей' })
  list() {
    return { endpoint: 'manager/vehicles' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить автомобиль по идентификатору' })
  @ApiResponse({ status: 200, description: 'Детали автомобиля' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/vehicles/${id}` };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные автомобиля' })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({ status: 200, description: 'Автомобиль обновлен' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return { endpoint: `manager/vehicles/${id}`, dto };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'soft удалить автомобиль' })
  @ApiResponse({ status: 200, description: 'Автомобиль помечен как удаленный' })
  remove(@Param('id') id: string) {
    return { endpoint: `manager/vehicles/${id}` };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Восстановить ранее удаленный автомобиль' })
  @ApiResponse({ status: 200, description: 'Автомобиль восстановлен' })
  restore(@Param('id') id: string) {
    return { endpoint: `manager/vehicles/${id}/restore` };
  }
}

@ApiTags('Тарифы менеджера')
@Controller('manager/tariffs')
export class TariffController {
  @Post()
  @ApiOperation({ summary: 'Создать тариф' })
  @ApiBody({ type: CreateTariffDto })
  @ApiResponse({ status: 201, description: 'Тариф создан' })
  create(@Body() dto: CreateTariffDto) {
    return { endpoint: 'manager/tariffs', dto };
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список тарифов без soft удаленных записей',
  })
  @ApiResponse({ status: 200, description: 'Список тарифов' })
  list() {
    return { endpoint: 'manager/tariffs' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тариф по идентификатору' })
  @ApiResponse({ status: 200, description: 'Детали тарифа' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/tariffs/${id}` };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные тарифа' })
  @ApiBody({ type: UpdateTariffDto })
  @ApiResponse({ status: 200, description: 'Тариф обновлен' })
  update(@Param('id') id: string, @Body() dto: UpdateTariffDto) {
    return { endpoint: `manager/tariffs/${id}`, dto };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'soft удалить тариф' })
  @ApiResponse({ status: 200, description: 'Тариф помечен как удаленный' })
  remove(@Param('id') id: string) {
    return { endpoint: `manager/tariffs/${id}` };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Восстановить ранее удаленный тариф' })
  @ApiResponse({ status: 200, description: 'Тариф восстановлен' })
  restore(@Param('id') id: string) {
    return { endpoint: `manager/tariffs/${id}/restore` };
  }
}

@ApiTags('Зоны менеджера')
@Controller('manager/zones')
export class ZoneController {
  @Post()
  @ApiOperation({ summary: 'Создать зону с геометрией GeoJSON Polygon' })
  @ApiBody({ type: CreateZoneDto })
  @ApiResponse({ status: 201, description: 'Зона создана' })
  create(@Body() dto: CreateZoneDto) {
    return { endpoint: 'manager/zones', dto };
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список зон с учетом активности и softго удаления',
  })
  @ApiResponse({ status: 200, description: 'Список зон' })
  list() {
    return { endpoint: 'manager/zones' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить зону по идентификатору с геометрией GeoJSON Polygon',
  })
  @ApiResponse({ status: 200, description: 'Детали зоны' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/zones/${id}` };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить поля зоны и или геометрию GeoJSON Polygon',
  })
  @ApiBody({ type: UpdateZoneDto })
  @ApiResponse({ status: 200, description: 'Зона обновлена' })
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return { endpoint: `manager/zones/${id}`, dto };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'soft удалить зону',
  })
  @ApiResponse({ status: 200, description: 'Зона помечена как удаленная' })
  remove(@Param('id') id: string) {
    return { endpoint: `manager/zones/${id}` };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Восстановить ранее удаленную зону' })
  @ApiResponse({ status: 200, description: 'Зона восстановлена' })
  restore(@Param('id') id: string) {
    return { endpoint: `manager/zones/${id}/restore` };
  }
}

@ApiTags('Поездки менеджера')
@Controller('manager/trips')
export class ManagerTripController {
  @Get('active')
  @ApiOperation({ summary: 'Получить все активные поездки' })
  @ApiResponse({ status: 200, description: 'Список активных поездок' })
  active() {
    return { endpoint: 'manager/trips/active' };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Получить историю завершенных и отмененных поездок',
  })
  @ApiResponse({ status: 200, description: 'История поездок' })
  history() {
    return { endpoint: 'manager/trips/history' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детали поездки по идентификатору' })
  @ApiResponse({ status: 200, description: 'Детали поездки' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/trips/${id}` };
  }
}

@ApiTags('Нарушения менеджера')
@Controller('manager/violations')
export class ViolationController {
  @Get()
  @ApiOperation({ summary: 'Получить список нарушений' })
  @ApiResponse({ status: 200, description: 'Список нарушений' })
  list() {
    return { endpoint: 'manager/violations' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику по нарушениям' })
  @ApiResponse({ status: 200, description: 'Статистика нарушений' })
  stats() {
    return { endpoint: 'manager/violations/stats' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить нарушение по идентификатору' })
  @ApiResponse({ status: 200, description: 'Детали нарушения' })
  getById(@Param('id') id: string) {
    return { endpoint: `manager/violations/${id}` };
  }

  @Post(':id/warn')
  @ApiOperation({ summary: 'Отправить предупреждение по нарушению' })
  @ApiResponse({ status: 200, description: 'Предупреждение отправлено' })
  warn(@Param('id') id: string) {
    return { endpoint: `manager/violations/${id}/warn` };
  }
}
