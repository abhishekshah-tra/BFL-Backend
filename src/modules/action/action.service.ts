import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Action,
  ActionDocument,
} from '../../schemas/action.schema.js';

import { CreateActionDto } from './dto/create-action.dto.js';
import { UpdateActionDto } from './dto/update-action.dto.js';

@Injectable()
export class ActionsService {
  constructor(
    @InjectModel(Action.name)
    private readonly actionModel: Model<ActionDocument>,
  ) {}

  async create(createActionDto: CreateActionDto) {
    const code = createActionDto.code.trim().toUpperCase();

    const existing = await this.actionModel.findOne({ code });

    if (existing) {
      throw new ConflictException(
        `Action with code ${code} already exists`,
      );
    }

    return this.actionModel.create({
      ...createActionDto,
      code,
    });
  }

  async findAll() {
    return this.actionModel
      .find()
      .sort({ name: 1 })
      .lean();
  }

  async findOne(id: string) {
    const action = await this.actionModel.findById(id).lean();

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    return action;
  }

  async update(id: string, updateActionDto: UpdateActionDto) {
    const action = await this.actionModel.findById(id);

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (updateActionDto.code) {
      const code = updateActionDto.code.trim().toUpperCase();

      const existing = await this.actionModel.findOne({
        code,
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException(
          `Action with code ${code} already exists`,
        );
      }

      updateActionDto.code = code;
    }

    Object.assign(action, updateActionDto);

    return action.save();
  }

  async remove(id: string) {
    const action = await this.actionModel.findById(id);

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    action.isActive = false;

    await action.save();

    return {
      message: 'Action deactivated successfully',
    };
  }
}