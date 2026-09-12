import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Menu,
  MenuDocument,
} from '../../schemas/menu.schema.js';

import { CreateMenuDto } from './dto/create-menu.dto.js';
import { UpdateMenuDto } from './dto/update-menu.dto.js';

@Injectable()
export class MenusService {
  constructor(
    @InjectModel(Menu.name)
    private readonly menuModel: Model<MenuDocument>,
  ) {}

  async create(dto: CreateMenuDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.menuModel.findOne({ code });

    if (existing) {
      throw new ConflictException(
        `Menu with code ${code} already exists`,
      );
    }

    if (dto.parentId) {
      const parent = await this.menuModel.findById(dto.parentId);

      if (!parent) {
        throw new NotFoundException('Parent menu not found');
      }
    }

    return this.menuModel.create({
      ...dto,
      code,
      parentId: dto.parentId
        ? new Types.ObjectId(dto.parentId)
        : null,
    });
  }

  async findAll() {
    return this.menuModel
      .find()
      .populate('parentId', 'name code')
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }

  async findOne(id: string) {
    const menu = await this.menuModel
      .findById(id)
      .populate('parentId', 'name code')
      .lean();

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu;
  }

  async update(id: string, dto: UpdateMenuDto) {
    const menu = await this.menuModel.findById(id);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();

      const existing = await this.menuModel.findOne({
        code,
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException(
          `Menu with code ${code} already exists`,
        );
      }

      dto.code = code;
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException(
          'Menu cannot be its own parent',
        );
      }

      const parent = await this.menuModel.findById(dto.parentId);

      if (!parent) {
        throw new NotFoundException('Parent menu not found');
      }
    }

    const updateData: any = {
      ...dto,
    };

    if ('parentId' in dto) {
      updateData.parentId = dto.parentId
        ? new Types.ObjectId(dto.parentId)
        : null;
    }

    Object.assign(menu, updateData);

    return menu.save();
  }

  async remove(id: string) {
    const menu = await this.menuModel.findById(id);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    const childCount = await this.menuModel.countDocuments({
      parentId: menu._id,
      isActive: true,
    });

    if (childCount > 0) {
      throw new ConflictException(
        'Menu has active child menus',
      );
    }

    menu.isActive = false;

    await menu.save();

    return {
      message: 'Menu deactivated successfully',
    };
  }
}