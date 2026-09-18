import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateProcessmasterDto } from './dto/create-processmaster.dto.js';
import { UpdateProcessmasterDto } from './dto/update-processmaster.dto.js';
import { Process, ProcessDocument } from '../../schemas/process.schema.js';

@Injectable()
export class ProcessmasterService {
  constructor(
    @InjectModel(Process.name)
    private readonly processModel: Model<ProcessDocument>,
  ) {}

  async create(dto: CreateProcessmasterDto) {
    const code = dto.code.trim().toUpperCase();
    const existingProcess = await this.processModel.findOne({ code });

    if (existingProcess) {
      throw new ConflictException(`Process with code ${code} already exists`);
    }

    return this.processModel.create({
      ...dto,
      code,
    });
  }

  async findAll() {
    return this.processModel
      .find()
      .sort({ sequence: 1, createdAt: -1 })
      .lean();
  }

  async findOne(id: string) {
    const process = await this.processModel.findById(id).lean();

    if (!process) {
      throw new NotFoundException(`Process with id ${id} not found`);
    }

    return process;
  }

  async update(id: string, dto: UpdateProcessmasterDto) {
    const process = await this.processModel.findById(id);

    if (!process) {
      throw new NotFoundException(`Process with id ${id} not found`);
    }

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const existing = await this.processModel.findOne({
        code,
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException(`Process with code ${code} already exists`);
      }

      dto.code = code;
    }

    Object.assign(process, dto);
    return process.save();
  }

  async remove(id: string) {
    const process = await this.processModel.findById(id);

    if (!process) {
      throw new NotFoundException(`Process with id ${id} not found`);
    }

    process.isActive = false;
    await process.save();

    return {
      message: 'Process deactivated successfully',
    };
  }
}
