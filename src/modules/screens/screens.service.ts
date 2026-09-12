import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Screen,
  ScreenDocument,
} from '../../schemas/screen.schema.js';

import { Menu, MenuDocument } from '../../schemas/menu.schema.js';

import { CreateScreenDto } from './dto/create-screen.dto.js';
import { UpdateScreenDto } from './dto/update-screen.dto.js';

@Injectable()
export class ScreensService {
  constructor(
    @InjectModel(Screen.name)
    private readonly screenModel: Model<ScreenDocument>,

    @InjectModel(Menu.name)
    private readonly menuModel: Model<MenuDocument>,
  ) {}

  async create(dto: CreateScreenDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.screenModel.findOne({ code });

    if (existing) {
      throw new ConflictException(
        `Screen with code ${code} already exists`,
      );
    }

    const menu = await this.menuModel.findById(dto.menuId);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return this.screenModel.create({
      ...dto,
      code,
      menuId: new Types.ObjectId(dto.menuId),
    });
  }

  async findAll() {
    return this.screenModel
      .find()
      .populate('menuId', 'name code')
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }

  async findOne(id: string) {
    const screen = await this.screenModel
      .findById(id)
      .populate('menuId', 'name code')
      .lean();

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    return screen;
  }

  async update(id: string, dto: UpdateScreenDto) {
    const screen = await this.screenModel.findById(id);

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();

      const existing = await this.screenModel.findOne({
        code,
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException(
          `Screen with code ${code} already exists`,
        );
      }

      dto.code = code;
    }

    if (dto.menuId) {
      const menu = await this.menuModel.findById(dto.menuId);

      if (!menu) {
        throw new NotFoundException('Menu not found');
      }
    }

    const updateData: any = {
      ...dto,
    };

    if (dto.menuId) {
      updateData.menuId = new Types.ObjectId(dto.menuId);
    }

    Object.assign(screen, updateData);

    return screen.save();
  }

  async remove(id: string) {
    const screen = await this.screenModel.findById(id);

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    screen.isActive = false;

    await screen.save();

    return {
      message: 'Screen deactivated successfully',
    };
  }
}