import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWarehousemasterDto } from './dto/create-warehousemaster.dto.js';
import { UpdateWarehousemasterDto } from './dto/update-warehousemaster.dto.js';
import { Warehouse, WarehouseDocument } from '../../schemas/warehouse.schema.js';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class WarehousemasterService {

  constructor(
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
  ) {}

  async create(dto: CreateWarehousemasterDto) {
    const code = dto.code.trim().toUpperCase();
    const existingWarehouse = await this.warehouseModel.findOne({ code });
    if (existingWarehouse) {
      throw new ConflictException(`Warehouse with code ${code} already exists`);
    }
    return this.warehouseModel.create({
      ...dto,
      code,
    });
  }

  async findAll() {
    return this.warehouseModel
    .find()
    .sort({ createdAt: -1 })
    .lean();
  }

  async findOne(id: string) {
    const warehouse = await this.warehouseModel
    .findById(id)
    .lean();
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with id ${id} not found`);
    }
    return warehouse;
  }

  async update(id: string, dto: UpdateWarehousemasterDto) {
    const warehouse = await this.warehouseModel.findById(id);

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with id ${id} not found`);
    }

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const existing = await this.warehouseModel.findOne({
        code,
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException(`Warehouse with code ${code} already exists`);
      }

      dto.code = code;
    }

    Object.assign(warehouse, dto);
    return warehouse.save();
  }

  async remove(id: string) {
    const warehouse = await this.warehouseModel.findById(id);

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with id ${id} not found`);
    }

    warehouse.isActive = false;
    await warehouse.save();

    return {
      message: 'Warehouse deactivated successfully',
    };
  }
}
