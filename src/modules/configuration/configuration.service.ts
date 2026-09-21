import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Configuration,
  ConfigurationDocument,
} from '../../schemas/configuration.schema.js';
import { Process, ProcessDocument } from '../../schemas/process.schema.js';
import {
  Warehouse,
  WarehouseDocument,
} from '../../schemas/warehouse.schema.js';
import {
  ConfigurationProcessDto,
  ConfigurationResourceDto,
  CreateConfigurationDto,
} from './dto/create-configuration.dto.js';
import { UpdateConfigurationDto } from './dto/update-configuration.dto.js';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectModel(Configuration.name)
    private readonly configurationModel: Model<ConfigurationDocument>,
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
    @InjectModel(Process.name)
    private readonly processModel: Model<ProcessDocument>,
  ) {}

  async create(dto: CreateConfigurationDto) {
    const warehouseId = this.toObjectId(dto.warehouseId, 'warehouse id');
    await this.ensureWarehouseExists(warehouseId);

    const processes = dto.processes || [];
    const resources = dto.resources || [];

    await this.ensureProcessesExist([...processes, ...resources]);

    const name = dto.name.trim();
    await this.ensureUniqueName(warehouseId, name);

    return this.configurationModel.create({
      warehouseId,
      name,
      effectiveFrom: dto.effectiveFrom,
      isActive: dto.isActive ?? true,
      processes: processes.map((item) => this.mapProcess(item)),
      resources: resources.map((item) => this.mapResource(item)),
    });
  }

  async findAll() {
    return this.configurationModel
      .find()
      .sort({ createdAt: -1 })
      .lean();
  }

  async findOne(id: string) {
    this.assertObjectId(id, 'configuration id');

    const configuration = await this.configurationModel.findById(id).lean();

    if (!configuration) {
      throw new NotFoundException(`Configuration with id ${id} not found`);
    }

    return configuration;
  }

  async update(id: string, dto: UpdateConfigurationDto) {
    this.assertObjectId(id, 'configuration id');

    const configuration = await this.configurationModel.findById(id);

    if (!configuration) {
      throw new NotFoundException(`Configuration with id ${id} not found`);
    }

    const warehouseId = dto.warehouseId
      ? this.toObjectId(dto.warehouseId, 'warehouse id')
      : configuration.warehouseId;

    if (dto.warehouseId) {
      await this.ensureWarehouseExists(warehouseId);
    }

    const processes = dto.processes;
    const resources = dto.resources;

    if (processes || resources) {
      await this.ensureProcessesExist([
        ...(processes || []),
        ...(resources || []),
      ]);
    }

    const name = dto.name?.trim() || configuration.name;

    if (
      dto.name ||
      (dto.warehouseId &&
        String(warehouseId) !== String(configuration.warehouseId))
    ) {
      await this.ensureUniqueName(warehouseId, name, id);
    }

    if (dto.warehouseId) configuration.warehouseId = warehouseId;
    if (dto.name) configuration.name = name;
    if (dto.effectiveFrom) configuration.effectiveFrom = dto.effectiveFrom as never;
    if (dto.isActive !== undefined) configuration.isActive = dto.isActive;
    if (processes) {
      configuration.processes = processes.map((item) => this.mapProcess(item));
    }
    if (resources) {
      configuration.resources = resources.map((item) => this.mapResource(item));
    }

    return configuration.save();
  }

  async remove(id: string) {
    this.assertObjectId(id, 'configuration id');

    const configuration = await this.configurationModel.findById(id);

    if (!configuration) {
      throw new NotFoundException(`Configuration with id ${id} not found`);
    }

    configuration.isActive = false;
    await configuration.save();

    return {
      message: 'Configuration deactivated successfully',
    };
  }

  private mapProcess(item: ConfigurationProcessDto) {
    return {
      processId: this.toObjectId(item.processId, 'process id'),
      enabled: item.enabled ?? true,
      capacityPerHour: item.capacityPerHour,
      sla: item.sla,
      slaUnit: item.slaUnit,
    };
  }

  private mapResource(item: ConfigurationResourceDto) {
    return {
      resourceType: item.resourceType,
      processId: this.toObjectId(item.processId, 'process id'),
      plannedQuantity: item.plannedQuantity,
      availableQuantity: item.availableQuantity,
      productivity: item.productivity,
      unit: item.unit,
      isActive: item.isActive ?? true,
    };
  }

  private async ensureWarehouseExists(warehouseId: Types.ObjectId) {
    const warehouse = await this.warehouseModel.findById(warehouseId).lean();

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
  }

  private async ensureProcessesExist(
    items: Array<{ processId?: string }>,
  ) {
    const ids = [
      ...new Set(
        items
          .map((item) => item.processId)
          .filter((id): id is string => Boolean(id)),
      ),
    ].map((id) => this.toObjectId(id, 'process id'));

    if (!ids.length) return;

    const count = await this.processModel.countDocuments({
      _id: { $in: ids },
    });

    if (count !== ids.length) {
      throw new NotFoundException('One or more processes were not found');
    }
  }

  private async ensureUniqueName(
    warehouseId: Types.ObjectId,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.configurationModel.findOne({
      warehouseId,
      name,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    if (existing) {
      throw new ConflictException(
        `Configuration with name ${name} already exists for this warehouse`,
      );
    }
  }

  private toObjectId(id: string, label: string) {
    this.assertObjectId(id, label);
    return new Types.ObjectId(id);
  }

  private assertObjectId(id: string, label: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }
}
